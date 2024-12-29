<script lang="ts">
  let {data} = $props();
</script>
{data.serverMessage}
<br>
Dev: {data.devState}


<form method="POST">
	<label>
		Email
		<input name="email" type="email">
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
</form>
