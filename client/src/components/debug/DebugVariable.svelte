<script lang="ts">
	export let variable: any;
	export let name: string;
</script>

<div class="debug-variable">
	<div class="debug-variable__name">{name}</div>
	<pre class="debug-variable__value">{JSON.stringify(variable, null, 2)}</pre>
</div>
