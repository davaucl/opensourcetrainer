import { writable } from 'svelte/store';
import type { Workout } from '../types';

export const workouts = writable<Workout[]>([]);

export function addWorkout(workout: Workout) {
	workouts.update((list) => [...list, workout]);
}

export function removeWorkout(id: string) {
	workouts.update((list) => list.filter((w) => w.id !== id));
}