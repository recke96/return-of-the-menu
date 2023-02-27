<script lang="ts">
    import {Card, Icon} from 'svelte-chota';
    import {mdiBlockHelper} from "@mdi/js";
    import type {Restaurant} from './menu.ts';
    import sanitize from "sanitize-html";

    export let restaurant: Restaurant;
    let menus = restaurant.weekdayMenus[0]?.menuItems ?? [];
</script>

<Card style="height: 100%">
    <h2 slot="header">{restaurant.name}</h2>

    {#if (menus.length > 0)}
        <table class="striped">
            <thead>
            <tr>
                <th>Menu</th>
                <th>Description</th>
                <th>Price</th>
            </tr>
            </thead>
            <tbody>
            {#each menus as menu (menu.id)}
                <tr>
                    <th>{menu.title}</th>
                    <th>{@html sanitize(menu.content)}</th>
                    <th>{new Intl.NumberFormat('de-AT', {
                        style: "currency",
                        currency: menu.currency
                    }).format(menu.price / 100)}</th>
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
