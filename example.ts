type Fake = {
  a: string;
  b: number;
  c: string;
  d: string[];
  e: number[];
  f: (string | number)[];
  g: {
    a: string;
    b: number;
    c: string;
    d: string[];
    e: number[];
    f: (string | number)[];
    g: {
      a: string;
      b: number;
      c: string;
      d: string[];
      e: number[];
      f: (string | number)[];
    };
  };
  h: boolean;
};

export abstract class FakeAbstractClass {
  public abstract fakeMethod(): Fake;
}
