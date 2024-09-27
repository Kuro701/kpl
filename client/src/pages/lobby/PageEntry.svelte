<script>
  import ProfileEditor from './ProfileEditor.svelte';

  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connect } from '../../lib/networking/client';
  import { randomUsername } from '../../lib/random';

  let username = window.localStorage.getItem('nickname') || randomUsername();
  async function randomJoin() {
    await connect({
      provider: 'anonymous',
      username: username,
      user_id: '',
      user_token: '',
    });
  }

  async function showLobby() {

  }

  async function createRoom() {

  }
</script>
<LayoutMenu>
  <ItemList>
    <h1>Hrát</h1>
  </ItemList>

  <TwoColumns>
    <ItemList slot="left">
      <h2>Rychlá hra</h2>

      <ProfileEditor bind:username />

      <div class="actions">
        <div class="action">
          <button class="button" on:click={randomJoin}>
            Náhodně připojit
          </button>
        </div>
        <div class="action">
          <button class="button">
            Místnosti
          </button>
          <button class="button" aria-label="Vytvořit místnost" data-balloon-pos="right">
            <img src="/img/icons/plus.png" alt="Vytvořit místnost" class="icon invert" draggable="false" />
          </button>
        </div>
      </div>


    </ItemList>
    <ItemList slot="right">

    </ItemList>
  </TwoColumns>
</LayoutMenu>

<style>
  .actions {
    display: flex;
    flex-direction: column;
    width: 15rem;
    gap: .5rem;
    margin: 1rem 0 2rem 0;
  }
  .action {
    display: flex;
    justify-content: space-between;
    gap: .25rem;
  }
  .action > .button:first-child {
    flex: 1;
  }
</style>
