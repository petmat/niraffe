import { StringBuilder } from "../system/text/StringBuilder";

const PoolLimits = {
  MinimumCapacity: 5000,
  MaximumCapacity: 40000,
  MaximumLifetime: 10 * 60 * 1000, // 10 min in ms
};

export class StringBuilderPool {
  private static isEnabled: boolean;
  private static instance: StringBuilder | null;
  private static created: Date;

  static get IsEnabled(): boolean {
    return this.isEnabled;
  }
  static set IsEnabled(value: boolean) {
    this.isEnabled = value;
  }

  static Rent(): StringBuilder {
    switch (StringBuilderPool.IsEnabled) {
      case false:
        return new StringBuilder(PoolLimits.MinimumCapacity);
      case true: {
        const lifetime =
          new Date().getTime() - StringBuilderPool.created.getTime();
        const expired = lifetime > PoolLimits.MaximumLifetime;
        const sb = StringBuilderPool.instance;
        if (!expired && sb) {
          StringBuilderPool.instance = null;
          return sb.Clear();
        } else {
          return new StringBuilder(PoolLimits.MinimumCapacity);
        }
      }
    }
  }

  static Release(sb: StringBuilder): void {
    if (sb.Capacity <= PoolLimits.MaximumCapacity) {
      StringBuilderPool.instance = sb;
      StringBuilderPool.created = new Date();
    }
  }
}
