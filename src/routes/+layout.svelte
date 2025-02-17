<script>
    import Header from './Header.svelte';
    import '../app.css';
</script>

<Header />

<main class="container">
    <slot />
</main>

<style>
    main {
        padding: 1rem;
    }
</style> 