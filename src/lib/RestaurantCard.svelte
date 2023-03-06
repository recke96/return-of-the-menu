<script lang="ts">
    import {Card, Icon} from 'svelte-chota';
    import {mdiBlockHelper} from "@mdi/js";
    import type {Menu} from './menu/menu.ts';
    import sanitize from "sanitize-html";

    export let menu: Menu;
</script>

<Card style="height: 100%">
    <h2 slot="header">{menu.restaurant}</h2>

    {#if (menu.items.length > 0)}
        <table class="striped">
            <thead>
            <tr>
                <th>Menu</th>
                <th>Description</th>
                <th>Price</th>
            </tr>
            </thead>
            <tbody>
            {#each menu.items as item (item.id)}
                <tr>
                    <td>{item.title}</td>
                    <td>{@html sanitize(item.description)}</td>
                    <td>{new Intl.NumberFormat('de-AT', {
                        style: "currency",
                        currency: item.currency
                    }).format(item.price)}</td>
                </tr>
            {/each}
            </tbody>
        </table>
    {:else}
        <div class="is-center">
            <span style="margin-right: 5px">
                <Icon src={mdiBlockHelper} size="1.5"/>
            </span>
            No Menu
        </div>
    {/if}
</Card>
