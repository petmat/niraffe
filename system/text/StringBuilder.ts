export class StringBuilder {
  private str: string;

  constructor(private capacity: number) {
    this.str = "";
  }

  get Capacity(): number {
    return this.capacity;
  }

  Append(value: string): StringBuilder {
    this.str += value;
    return this;
  }

  Clear(): StringBuilder {
    this.str = "";
    return this;
  }

  get Value(): string {
    return this.str;
  }
}
