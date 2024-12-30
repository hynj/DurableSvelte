<script lang="ts">
import { Label } from "$lib/components/ui/label/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { Button } from "$lib/components/ui/button/index.js";
    import { enhance } from "$app/forms";
  const { data,form } = $props();
</script>

<div class="m-4 w-full">
  <h3
    class="w-full text-2xl border-b border-red-500 font-medium text-gray-900 dark:text-white"
  >
    Notes
  </h3>

  <div>
    <form method="POST" action="?/add" class="space-y-2 pt-6" use:enhance>
      <div class="flex w-full max-w-sm flex-col gap-1.5">
        <Label for="name">Name</Label>
        <Input type="text" id="name" name="name" placeholder="" />
        {#if form?.issues?.name}
          <p class="text-red-500">{form.issues.name}</p>
        {/if}

        <Label for="content">Content</Label>
        <Input type="text" id="content" name="content" placeholder="" />
        {#if form?.issues?.content}
          <p class="text-red-500">{form.issues.content}</p>
        {/if}
        <Button class="w-full" type="submit">Add Note</Button>
      </form>
    </div>

  <div class="mt-4">
    {#if data.notes != null}
      {#each data.notes as note}
        <p>{note.name}</p>
      {/each}
    {/if}
  </div>
</div>
