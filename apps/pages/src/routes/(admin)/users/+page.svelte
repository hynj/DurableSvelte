<script lang="ts">

const {data} = $props();

</script>
<div class="m-4 w-full">
      <h3
      class="w-full text-2xl border-b border-red-500 font-medium text-gray-900 dark:text-white"
    >
      Users
    </h3>

  <div class="mt-4">
{#each data.users as user}
  <p>{user.name}</p>
{/each}
    </div>

  </div>
