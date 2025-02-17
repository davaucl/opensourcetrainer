export interface Interval {
	duration: number;    // in seconds
	targetPower: number; // in watts
}

export interface Workout {
	id: string;
	name: string;
	intervals: Interval[];
}