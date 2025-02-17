<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { workouts } from '$lib/stores/workouts';
	import { isConnected } from '$lib/stores/ble';
	import { page } from '$app/stores';
	import { BluetoothService } from '$lib/services/bluetooth';
	import { PowerController } from '$lib/services/power';
	import type { Workout } from '$lib/types';

	let workout: Workout | undefined;
	let bluetoothService: BluetoothService;
	let powerController: PowerController;
	let currentIntervalIndex = 0;
	let currentIntervalTime = 0;
	let totalTime = 0;
	let isRunning = false;
	let intervalTimer: number | null = null;
	let currentPower = 0;
	let targetPower = 0;
	let hasControl = false;
	let unsubscribeFromBikeData: (() => void) | undefined;

	onMount(async () => {
		const workoutId = $page.params.id;
		workout = $workouts.find((w) => w.id === workoutId);

		if (!workout) {
			console.error('Workout not found:', workoutId);
			return;
		}

		bluetoothService = new BluetoothService();
		powerController = new PowerController(bluetoothService);

		if ($isConnected) {
			await setupWorkout();
		}
	});

	onDestroy(() => {
		clearIntervalIfNeeded();
		unsubscribeFromBikeData?.();
		bluetoothService?.cleanup();
	});

	async function setupWorkout() {
		hasControl = await bluetoothService.requestControl();
		if (hasControl) {
			unsubscribeFromBikeData = bluetoothService.subscribeToIndoorBikeData((power) => {
				currentPower = power;
				if (isRunning) {
					void powerController.handlePowerData(power);
				}
			});
		}
	}

	async function startWorkout() {
		if (!workout || !hasControl) return;

		const started = await bluetoothService.startWorkout();
		if (!started) return;

		isRunning = true;
		currentIntervalIndex = 0;
		currentIntervalTime = 0;
		updateInterval();
		startTimer();
	}

	async function stopWorkout() {
		const stopped = await bluetoothService.stopWorkout();
		if (stopped) {
			isRunning = false;
			clearIntervalIfNeeded();
		}
	}

	function startTimer() {
		if (intervalTimer) clearInterval(intervalTimer);
		intervalTimer = setInterval(updateWorkoutStatus, 1000);
	}

	function clearIntervalIfNeeded() {
		if (intervalTimer) {
			clearInterval(intervalTimer);
			intervalTimer = null;
		}
	}

	function updateWorkoutStatus() {
		if (!workout || !isRunning) return;

		currentIntervalTime++;
		totalTime++;

		if (currentIntervalTime >= workout.intervals[currentIntervalIndex].duration) {
			currentIntervalTime = 0;
			currentIntervalIndex++;

			if (currentIntervalIndex >= workout.intervals.length) {
				void stopWorkout();
				return;
			}

			updateInterval();
		}
	}

	async function updateInterval() {
		if (!workout) return;
		const interval = workout.intervals[currentIntervalIndex];
		targetPower = interval.targetPower;
		await powerController.setTarget(targetPower);
	}

	async function connectToKickr() {
		const connected = await bluetoothService.connect();
		if (connected) {
			await setupWorkout();
		}
	}
</script>

<div class="workout-page">
	<h1>{workout?.name || 'Workout'}</h1>

	<div class="connection-status">
		{#if $isConnected}
			<p class="status connected">Connected to KICKR</p>
			{#if !hasControl}
				<button on:click={setupWorkout}>Request Control</button>
			{:else}
				<p class="status">Has Control</p>
			{/if}
		{:else}
			<p class="status disconnected">Not Connected</p>
			<button on:click={connectToKickr}>Connect to KICKR</button>
		{/if}
	</div>

	<div class="workout-controls" class:disabled={!hasControl}>
		{#if !isRunning}
			<button on:click={startWorkout} disabled={!hasControl}>Start Workout</button>
		{:else}
			<button on:click={stopWorkout}>Stop Workout</button>
		{/if}
	</div>

	<div class="workout-status">
		<h2>Current Status</h2>
		<p>Interval: {currentIntervalIndex + 1} of {workout?.intervals.length || 0}</p>
		<p>Time in Interval: {currentIntervalTime}s</p>
		<p>Total Time: {totalTime}s</p>
		<p>Current Power: {currentPower}W</p>
		<p>Target Power: {targetPower}W</p>
	</div>

	{#if workout}
		<div class="intervals-preview">
			<h2>Workout Intervals</h2>
			<ul>
				{#each workout.intervals as interval, i}
					<li class:active={i === currentIntervalIndex}>
						Interval {i + 1}: {interval.duration}s @ {interval.targetPower}W
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.workout-page {
		padding: 1rem;
	}

	.connection-status {
		margin: 1rem 0;
	}

	.status {
		font-weight: bold;
	}

	.connected {
		color: var(--primary);
	}

	.disconnected {
		color: var(--warning);
	}

	.workout-controls.disabled {
		opacity: 0.5;
	}

	.workout-status {
		margin: 1rem 0;
		padding: 1rem;
		background: var(--background-alt);
		border-radius: 4px;
	}

	.intervals-preview {
		margin-top: 2rem;
	}

	.intervals-preview ul {
		list-style: none;
		padding: 0;
	}

	.intervals-preview li {
		padding: 0.5rem;
		margin: 0.25rem 0;
		border-radius: 4px;
		background: var(--background);
	}

	.intervals-preview li.active {
		background: var(--primary);
		color: white;
	}
</style>