<script>


    const apiURL = "https://projectpraxe.hasura.app/v1/graphql";

    async function getData(query) {
        const response = await fetch(apiURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret":
                    "T6wpZtqF9sVk41BQRkVyaw1AB1L2c4l01bqF752qB2w0QQWnSKLy2di75UjU86fQ",
            },
            body: JSON.stringify({ query }),
        })
            .then((response) => response.json())
            .then((data) => console.log(data));
    }

    getData(`
        query {
            DlouhaOsa {
                Cena
                Delka
                Hmotnost
                id
            }
            Jednorucka {
                Cena
                Delka
                Hmotnost
                id
            }
            Kratasy {
                Barva
                Cena
                Latka
                Velikost
                id
            }
            Mikiny {
                Barva
                Cena
                Latka
                Velikost
                id
            }
            Proteiny {
                Cena
                Mnozstvi
                Prichut
                Prodejce
                ZemeVyroby
                id
                id_protein
            }
            Tricka {
                Barva
                Cena
                Latka
                Velikost
                id
            }
        }
    `
    );
</script>
