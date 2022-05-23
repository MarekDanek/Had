<script>
import PostList from "./PostList.svelte";

function CreateUser(Jmeno, Prijmeni, Adresa, Telefon, Email, Vek) {
	fetch(
  "https://projectpraxe.hasura.app/v1/graphql",
  {
  method: 'POST',
  headers: {
  "Content-Type": "application/json",
  "x-hasura-admin-secret": "T6wpZtqF9sVk41BQRkVyaw1AB1L2c4l01bqF752qB2w0QQWnSKLy2di75UjU86fQ" 
  },
  body: JSON.stringify({
  "query": `
  mutation CreateUser($Vek: Int!, $Telefon: Int!, $Prijmeni: String!, $Jmeno: String!, $Email: String!, $Adresa: String!) {
    insert_Ucet_one(object: {Vek: $Vek, Telefon: $Telefon, Prijmeni: $Prijmeni, Jmeno: $Jmeno, Email: $Email, Adresa: $Adresa}) {
      id
    }
  }
  `,
  "variables": {
	Jmeno,
	Prijmeni,
	Adresa,
	Telefon,
	Email,
	Vek
  }
  })
  }).then(response => response.json()).then(data => console.log(data));
}

</script>

<main>
	<PostList />
	<div>
		<a href="index.html">
			<img
				src="fitness.png"
				id="logo"
				style="width: 180px;height: 180px;margin-left: 43%;"
				alt=""
			/>
		</a>
		<a href="account.html">
			<img
				class="account"
				src="account.png"
				id="account"
				style="width: 70px;height: 70px;float: right;"
				alt=""
			/>
		</a>
	</div>

	<div class="DlouhaOsa">
		<button class="DlouhaOsa-btn">Proteiny</button>
		<div class="DlouhaOsa-content">
			<a href="Jahodovy.html">Jahodový</a>
			<a href="Cokoladovy.html">Čokolávý</a>
			<a href="Vanilkovy.html">Vanilkový</a>
			<a href="Bananovy.html">Banánový</a>
			<a href="Kokosovy.html">Kokosový</a>
		</div>
	</div>

	<div class="Cinky">
		<button class="Cinky-btn">Činky</button>
		<div class="Cinky-content">
			<a href="DlouhaOsa.html">Dlouhá Osa</a>
			<a href="Jednorucka.html">Jednoručka</a>
		</div>
	</div>

	<div class="Obleceni">
		<button class="Obleceni-btn">Oblečení</button>
		<div class="Obleceni-content">
			<a href="Tricka.html">Trička</a>
			<a href="Kratasy.html">Kraťasy</a>
			<a href="Mikiny.html">Mikiny</a>
		</div>
	</div>
	<button on:click="{()=>{CreateUser("Phíčus", "brand","skalka", 78789, "minafnf",78)}}">
klikfg
	</button>
</main>

<style>
	main {
		text-align: left;
		padding: 3em;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
