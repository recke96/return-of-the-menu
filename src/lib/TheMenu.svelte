<script lang="ts">
    import {Icon, Row, Col} from 'svelte-chota';
    import {mdiSync, mdiAlertCircle} from '@mdi/js';
    import {menuService} from './menu/menu';
    import type {Menu} from "./menu/menu";
    import RestaurantCard from "./RestaurantCard.svelte";
    import {favorites} from "./favorites";

    export let date: Date;

    $: favoriteRestaurants = $favorites

    console.log(favoriteRestaurants)

    $: menuCompare = (a: Menu, b: Menu): number =>
        favoriteRestaurants.indexOf(b.restaurant) - favoriteRestaurants.indexOf(a.restaurant);
    $: data = menuService.getMenus(date)
        .then(menus => menus.sort(menuCompare));
</script>

{#await data}
    <div class="is-center">
        <Icon src={mdiSync} size="6" spin="1"/>
    </div>
{:then menus}
    <Row>
        {#each menus as menu (menu.restaurant)}
            <Col size="12" sizeMD="12" sizeLG="6">
                <RestaurantCard {menu}/>
            </Col>
        {/each}
    </Row>
{:catch err}
    <div class="bg-error" style="padding: 10px; border-radius: 5px">
        <span><Icon src={mdiAlertCircle} size="4"/></span>
        {err.message}
    </div>
{/await}
