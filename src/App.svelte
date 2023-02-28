<script lang="ts">
    import 'chota';
    import {Nav, Row, Button, Icon, Card, Input} from 'svelte-chota';
    import TheMenu from "./lib/TheMenu.svelte";
    import {mdiArrowLeft, mdiArrowRight, mdiSilverware} from '@mdi/js';
    import addDays from 'date-fns/addDays';
    import formatDate from 'date-fns/format';
    import parseDate from 'date-fns/parse';
    import isWeekend from 'date-fns/isWeekend';
    import nextMonday from 'date-fns/nextMonday';
    import previousFriday from 'date-fns/previousFriday';

    const today = new Date();
    const dateFmtMachine = "yyyy-MM-dd";
    const dateFmtHuman = "dd.MM.yyyy";
    const paramName = "date";
    const urlParams = new URLSearchParams(window.location.search);
    const dateStr = urlParams.get(paramName);

    let date = dateStr == null ? today : parseDate(dateStr, dateFmtMachine, today);
    let hoversTitle = false;
    let dateSelectOpen = false;

    const updateUrl = (date: Date) => {
        const url = new URL(window.location);
        url.searchParams.set(paramName, formatDate(date, dateFmtMachine));
        window.history.pushState(null, document.title, url);
    };
    const next = () => {
        let next = addDays(date, 1);
        if (isWeekend(next)) {
            next = nextMonday(next);
        }
        date = next;
        updateUrl(next);
    }
    const prev = () => {
        let prev = addDays(date, -1);
        if (isWeekend(prev)) {
            prev = previousFriday(prev);
        }
        date = prev;
        updateUrl(prev);
    }
    const home = () => {
        date = today;
        updateUrl(today);
    }

    let themePref = window.matchMedia('(prefers-color-scheme: dark)');
    if (themePref.matches) {
        document.body.classList.add("dark");
    }
    themePref.addEventListener("change", evt => {
        if (evt.matches) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    });
</script>

<svelte:head>
    <title>{formatDate(date, dateFmtHuman)} | Menu</title>
</svelte:head>

<Nav class="bg-primary">
    <div slot="left" class="is-vertical-align" class:bd-light={hoversTitle} on:click={home}
         on:mouseenter={()=> hoversTitle=true} on:mouseleave={()=> hoversTitle=false}>
        <Icon src={mdiSilverware} alt="Return of the Menu" size="6"/>
        <h1 class="hide-sm hide-xs">Return of the Menu</h1>
    </div>
    <div slot="center" class="grouped">
        <Button primary on:click={prev}>
            <Icon src={mdiArrowLeft} size="3"/>
        </Button>
        <details bind:open={dateSelectOpen} id="date-details" class="dropdown">
            <summary class="button primary">
                <h1>
                    {formatDate(date, dateFmtHuman)}
                    <br/>
                    <small>{formatDate(date, "EEEE")}</small>
                </h1>
            </summary>
            <Card style="width: 100%">
                <Input
                        date
                        value={formatDate(date, dateFmtMachine)}
                        on:change={evt => {
                            date = evt.target.valueAsDate;
                            dateSelectOpen = false;
                        }}
                        style="width: calc(100% - 20px)"
                />
            </Card>
        </details>
        <Button primary on:click={next}>
            <Icon src={mdiArrowRight} size="3"/>
        </Button>
    </div>
    <Row slot="right" class="is-vertical-align"></Row>
</Nav>
<main class="container" style="margin-top: 2em">
    <TheMenu {date}/>
</main>

<style>
    :global(:root) {
        --grid-maxWidth: 160rem;
    }

    :global(body.dark) {
        --bg-color: #000;
        --bg-secondary-color: #131316;
        --font-color: #f5f5f5;
        --color-grey: #ccc;
        --color-darkGrey: #777;
    }
</style>