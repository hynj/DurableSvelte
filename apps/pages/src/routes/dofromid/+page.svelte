<script lang="ts">

	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();
</script>
{data.serverMessage}
<br>
Dev: {data.devState}

<form method="POST">
	<label>
		ID
		<input name="idIn" type="text">
	</label>
	<button>test with do</button>
</form>

{#if form?.success}
	<!-- this message is ephemeral; it exists because the page was rendered in
	       response to a form submission. it will vanish if the user reloads -->
	<p>Successfully logged in! Welcome back</p>
{/if}



