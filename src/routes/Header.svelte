<script lang="ts">
    import { isConnected } from '../lib/stores/ble';
</script>

<header>
    <nav>
        <a href="/">Control</a>
        <a href="/workouts">Workouts</a>
        <div class="connection-status">
            {#if $isConnected}
                <span class="connected">Connected to KICKR</span>
            {:else}
                <span class="disconnected">Not Connected</span>
            {/if}
        </div>
    </nav>
</header>

<style>
    header {
        padding: 1rem;
        background: var(--background);
        border-bottom: 1px solid var(--border);
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }
    a {
        text-decoration: none;
        color: var(--text);
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    a:hover {
        background: var(--background-alt);
    }
    .connected {
        color: var(--primary);
        font-weight: 500;
    }
    .disconnected {
        color: var(--warning);
        font-weight: 500;
    }
    .connection-status {
        margin-left: auto;
        padding: 0.5rem 1rem;
    }
</style> 