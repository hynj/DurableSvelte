<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Input } from "$lib/components/ui/input/index.js";

  let {form} = $props();
  $effect(() => {
    console.log(form);
  })
</script>

<div class=" flex flex-col items-center pb-10 pt-5">
  <div class="w-96 px-6 pb-4">
    <h3
      class=" text-2xl border-b border-red-500 font-medium text-gray-900 dark:text-white"
    >
      Login
    </h3>
    <form method="POST" class="space-y-2 pt-6">
      <div class="flex w-full max-w-sm flex-col gap-1.5">
        <Label for="email">Email</Label>
        <Input type="email" id="email" name="email" placeholder="" />
        {#if form?.issues?.email}
          <p class="text-red-500">{form.issues.email}</p>
        {/if}

        <Label for="password">Password</Label>
        <Input type="password" id="password" name="password" placeholder="" />
        {#if form?.issues?.password}
          <p class="text-red-500">{form.issues.password}</p>
        {/if}

      </div>
      <Button class="w-full" type="submit">Login</Button>
    </form>
    {#if form?.message}
      <p class="text-red-500 mt-4">{form.message}</p>
    {/if}
  </div>
</div>
