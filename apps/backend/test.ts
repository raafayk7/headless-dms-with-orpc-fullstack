class Abc {
  constructor(private readonly abc: string) {}

  method() {
    return "4"
  }

  static bar() {
    return "3"
  }

  get ab() {
    return false
  }
}

console.debug(Object.keys(new Abc("test")))
