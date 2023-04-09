type Fake = {
	a: string;
	b: number;
	c: string | number;
	d: string[];
	e: number[];
	f: (string | number | boolean)[];
	g: {
		f: (string | number)[];
	};
	h: boolean;
	i: boolean[];
	j: {
		a: {
			a: {
				a: {
					f: string;
				};
				c: boolean;
			};
			n: number;
		};
		b: (string | number | boolean)[];
	};
};

export abstract class FakeAbstractClass {
	public abstract fakeMethod(): Fake;
}
