<script lang="ts">
    import { workouts } from '../../lib/stores/workouts';
    import type { Workout } from '../../lib/types';
    
    let newWorkout: Workout = {
        id: crypto.randomUUID(),
        name: '',
        intervals: []
    };
    
    function addInterval() {
        newWorkout.intervals = [...newWorkout.intervals, {
            duration: 300, // 5 minutes default
            targetPower: 150 // 150W default
        }];
    }
    
    function saveWorkout() {
        if (!newWorkout.name) return;
        workouts.update(w => [...w, newWorkout]);
        newWorkout = {
            id: crypto.randomUUID(),
            name: '',
            intervals: []
        };
    }
</script>

<h1>Workouts</h1>

<div class="saved-workouts">
    <h2>Saved Workouts</h2>
    {#if $workouts.length === 0}
        <p>No workouts saved yet.</p>
    {:else}
        <ul>
            {#each $workouts as workout}
                <li>
                    <span>{workout.name}</span>
                    <a href="/workouts/{workout.id}">Run</a>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<div class="create-workout">
    <h2>Create New Workout</h2>
    <div class="form">
        <label>
            Workout Name:
            <input type="text" bind:value={newWorkout.name} />
        </label>
        
        <h3>Intervals</h3>
        {#each newWorkout.intervals as interval, i}
            <div class="interval">
                <label>
                    Duration (seconds):
                    <input type="number" bind:value={interval.duration} min="1" />
                </label>
                <label>
                    Target Power (watts):
                    <input type="number" bind:value={interval.targetPower} min="0" />
                </label>
            </div>
        {/each}
        
        <button on:click={addInterval}>Add Interval</button>
        <button on:click={saveWorkout} disabled={!newWorkout.name}>Save Workout</button>
    </div>
</div>

<style>
    .saved-workouts {
        margin-bottom: 2rem;
    }
    
    .interval {
        display: flex;
        gap: 1rem;
        margin: 0.5rem 0;
    }
    
    .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 600px;
    }
    
    ul {
        list-style: none;
        padding: 0;
    }
    
    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid #ddd;
    }
    
    a {
        text-decoration: none;
        background: #4CAF50;
        color: white;
        padding: 0.25rem 1rem;
        border-radius: 4px;
    }
</style> 