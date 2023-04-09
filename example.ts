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
type Fake2 = {
	fe: string;
	ob: {
		ab: string;
		cd: (string | number)[];
	};
};

export abstract class FakeAbstractClass {
	public abstract fakeMethod(): Fake;
	public abstract fakeMethod2(): Fake2;
}
