<script lang="ts">
    import 'chota';
    import {Nav, Row, Col, Button, Icon} from 'svelte-chota';
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

    const navigate = (date: Date) => {
        const url = new URL(window.location);
        url.searchParams.set(paramName, formatDate(date, dateFmtMachine));
        window.history.pushState(null, document.title, url);
    };
    const next = () => {
        let next = addDays(date, 1);
        if (isWeekend(next)) {
            next = nextMonday(next);
        }
        navigate(next);
    }
    const prev = () => {
        let prev = addDays(date, -1);
        if (isWeekend(prev)) {
            prev = previousFriday(prev);
        }
        navigate(prev);
    }

    if (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
    }
</script>

<svelte:head>
    <title>{formatDate(date, dateFmtHuman)} | Menu</title>
</svelte:head>

<Nav class="bg-primary">
    <Row slot="left" class="is-vertical-align" on:click={() => navigate(today)}>
        <Col size="3">
            <Icon src={mdiSilverware} size="6"/>
        </Col>
        <Col>
            <h1>Return of the Menu</h1>
        </Col>
    </Row>
    <Row slot="center" class="is-vertical-align">
        <Col>
            <Button icon={mdiArrowLeft} on:click={prev}/>
        </Col>
        <Col><h1>{formatDate(date, dateFmtHuman)}</h1></Col>
        <Col>
            <Button icon={mdiArrowRight} on:click={next}/>
        </Col>
    </Row>
    <Row slot="right" class="is-vertical-align"></Row>
</Nav>
<TheMenu {date}/>

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