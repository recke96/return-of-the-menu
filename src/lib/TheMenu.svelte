<script lang="ts">
    import {Icon, Row, Col} from 'svelte-chota';
    import {mdiSync, mdiAlertCircle} from '@mdi/js';
    import {fetchMenuData} from './menu';
    import RestaurantCard from "./RestaurantCard.svelte";

    export let date: Date;

    $: data = fetchMenuData(date);
</script>

{#await data}
    <div class="is-center">
        <Icon src={mdiSync} size="6" spin="1"/>
    </div>
{:then restaurants}
    <Row>
        {#each restaurants as restaurant (restaurant.id)}
            <Col size="12" sizeMD="12" sizeLG="6">
                <RestaurantCard {restaurant}/>
            </Col>
        {/each}
    </Row>
{:catch err}
    <div class="bg-error" style="padding: 10px; border-radius: 5px">
        <span><Icon src={mdiAlertCircle} size="4"/></span>
        {err.message}
    </div>
{/await}
