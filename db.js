/* global DB */
// База скинов
const DB = {
    rarityOrder: ["mil-spec", "restricted", "classified", "covert", "gold"],
    cases: {
        kilowatt: { 
            name: "Кейс «Революция»", 
            price: 150, 
            img: "https://avatars.mds.yandex.net/i?id=e0bf22e23330f5fd47ba3aad9adffc900d650d62-4571300-images-thumbs&n=13" 
        },
        revolution: { 
            name: "Кейс «Киловатт»", 
            price: 250, 
            img: "https://escorenews.com/media/news/n55528.jpeg" 
        },
        dreams_nightmares: { 
            name: "Кейс «Грёзы и кошмары»", 
            price: 400, 
            img: "https://csspot.org/_next/image/?url=https%3A%2F%2Fcsspot.org%2Fuploads%2Fnightmares_open_e344d1b578.png&w=3840&q=75" 
        },
        sticker_capsule: { 
            name: "STICKER CAPSULE I", 
            price: 150, 
            img: "https://escorenews.com/media/news/pic-20260311-1280x720-9199237227.png" 
        }
    },
    stickersDB: [
        { name: "Обычная наклейка | NAVI", rarity: "mil-spec", bonusPrice: 40, color: "#4b69ff", short: "N" },
        { name: "Обычная наклейка | Virtus.pro", rarity: "mil-spec", bonusPrice: 45, color: "#4b69ff", short: "VP" },
        { name: "Голографическая | Team Spirit", rarity: "classified", bonusPrice: 150, color: "#d32ce6", short: "TS" },
        { name: "Голографическая | Cloud9", rarity: "classified", bonusPrice: 180, color: "#d32ce6", short: "C9" },
        { 
            name: "Золотая наклейка | Str1tacts Gold", 
            rarity: "gold", 
            bonusPrice: 600, 
            color: "#caab05", 
            short: "ST",
            img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><polygon points='50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36' fill='%23ffea00' stroke='%23d4af37' stroke-width='3'/><text x='50%' y='55%' font-family='Montserrat,sans-serif' font-weight='900' font-size='16' fill='%23000' text-anchor='middle'>S1</text></svg>"
        }
    ],
    skins: [
        // === Армейское качество (mil-spec) ===
        { name: "P250 | Песчаные дюны", rarity: "mil-spec", price: 5, img: "https://avatars.mds.yandex.net/i?id=dcb37c504f74c8c864d41a3ac841663fbc6ff680e2dc0025-4395898-images-thumbs&n=13" },
        { name: "MP9 | Капиляр", rarity: "mil-spec", price: 8, img: "https://avatars.mds.yandex.net/i?id=4bd339c86aaf5f8e60aeb33693af0085b1f7ec77-5161298-images-thumbs&n=13" },
        { name: "Glock-18 | Литьё", rarity: "mil-spec", price: 12, img: "https://avatars.mds.yandex.net/i?id=489c6ef7ace0e5bf5e0cdacb0930fce9b9d1924b-5879065-images-thumbs&n=13" },
        { name: "SG 553 | Киберпустота", rarity: "mil-spec", price: 15, img: "https://avatars.mds.yandex.net/i?id=8eb9b22ce54b522a2af718d43321775a461e0cd8-7547473-images-thumbs&n=13" },
        { name: "USP-S | Проводник", rarity: "mil-spec", price: 20, img: "https://avatars.mds.yandex.net/i?id=1f941352e8a4bb6f0ce31bea3603531b890ede44-12606366-images-thumbs&n=13" },
        { name: "M4A4 | Магний", rarity: "mil-spec", price: 25, img: "https://avatars.mds.yandex.net/i?id=dc886ae71f7a8f527b6110de49e18a9cfab3d98a-5878500-images-thumbs&n=13" },
        { name: "Galil AR | Леденец", rarity: "mil-spec", price: 35, img: "https://avatars.mds.yandex.net/i?id=aba4fc9168bf2b7b3dff686e067a8becef13bb83-5349176-images-thumbs&n=13" },
        { name: "MAC-10 | Light Box", rarity: "mil-spec", price: 10, img: "https://i.redd.it/i-think-this-is-the-best-craft-i-ever-made-mac-10-light-box-v0-qqr5lnwjcdhc1.png?width=1920&format=png&auto=webp&s=3ba09450315fcd6378b749c194fcb635dc647eef" },
        { name: "Nova | Clear Polymer", rarity: "mil-spec", price: 14, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4qhRb7VY8CUqSYoCqQtYsFisgYE_ajBSjyQ&s" },
        { name: "Tec-9 | Toxic", rarity: "mil-spec", price: 16, img: "https://cdn.csgoskins.gg/public/uih/thumbnails/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvdGh1bWJuYWlscy9nYW1lcGxheS92NC90ZWMtOS10b3hpYy5wbmc-/auto/auto/85/notrim/4dfba0761a2245989a303de05a24c720.png" },
        { name: "SSG 08 | Death's Head", rarity: "mil-spec", price: 22, img: "https://i.ytimg.com/vi/Vr9BkjkVLAs/maxresdefault.jpg" },
        { name: "FAMAS | Decommissioned", rarity: "mil-spec", price: 18, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Vb5Mapffwh62-yXkUK_QZAWgHgWXVJzBqQ&s" },
        { name: "AK-47 | Uncharted", rarity: "mil-spec", price: 30, img: "https://images.steamusercontent.com/ugc/952970795168025802/87EF765889F7492447757AEA208835D66898D474/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true" },
        { name: "P250 | Cyber Shell", rarity: "mil-spec", price: 15, img: "https://images.steamusercontent.com/ugc/1785091757726828566/7FE4A49D3703D2CA60A5A4896F5939D031C0C621/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true" },

        // === Запрещенное (restricted) ===
        { name: "MAC-10 | Саккаку", rarity: "restricted", price: 40, img: "https://avatars.mds.yandex.net/i?id=425674ebe5d9597d11fd7e9ecb45d64d285f3a35-4442687-images-thumbs&n=13" },
        { name: "AK-47 | Сланец", rarity: "restricted", price: 45, img: "https://avatars.mds.yandex.net/i?id=d470cf9c539cc5b04864f079c813aa903756236d-5221533-images-thumbs&n=13" },
        { name: "M4A1-S | Взгляд в прошлое", rarity: "restricted", price: 60, img: "https://avatars.mds.yandex.net/i?id=e9f46ec69e5174ee137275b3a0fde88b133fa269-5887216-images-thumbs&n=13" },
        { name: "AWP | Лапки", rarity: "restricted", price: 75, img: "https://avatars.mds.yandex.net/i?id=46621c231a2edce0bafac12475766aae034ada77-16433653-images-thumbs&n=13" },
        { name: "USP-S | Чудовищная смесь", rarity: "restricted", price: 90, img: "https://avatars.mds.yandex.net/i?id=546c3a6425816af0433d9595851b593cddf833c5-12167578-images-thumbs&n=13" },
        { name: "Five-SeveN | Hybrid", rarity: "restricted", price: 50, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPO_8V8jRm4ciLtYT3Q4rZk8D6Yw8WUeyuPg&s" },
        { name: "Glock-18 | Block-18", rarity: "restricted", price: 55, img: "https://pbs.twimg.com/media/GHW9o_tW0AA3JDa.jpg" },
        { name: "M4A4 | In Living Color", rarity: "restricted", price: 70, img: "https://cdn.esportfire-services.com/web/assets/images/article_images/20102024_Best_M4A4_Sticker_Crafts_Combos_pic10-min.jpg" },
        { name: "Desert Eagle | Conspiracy", rarity: "restricted", price: 85, img: "https://csbepro.com/wp-content/uploads/2024/11/Conspiracy-Desert-Eagle-Skin-in-Counter-Strike-2.jpg" },
        { name: "M4A1-S | Solitude", rarity: "restricted", price: 95, img: "https://i.ytimg.com/vi/pEptYlZZu2k/hq720.jpg?sqp=-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYAC0AWKAgwIABABGFUgYyhlMA8=&rs=AOn4CLBWJ-71SgscGfDQP--gRw--CD8ykA" },
        { name: "FAMAS | Rapid Eye Movement", rarity: "restricted", price: 48, img: "https://cdn.itemsatis.com/uploads/post_images/famas-rapid-eye-movement-field-tested-70067484.png" },

        // === Засекреченное (classified) ===
        { name: "M4A4 | Посейдон", rarity: "classified", price: 150, img: "https://avatars.mds.yandex.net/i?id=eb9cdd89969f9e0e170182838c90c2dba51e804c-12494001-images-thumbs&n=13" },
        { name: "Desert Eagle | Гипноз", rarity: "classified", price: 180, img: "https://avatars.mds.yandex.net/i?id=6d1f34fa0d69683f22acd51860a52962451ce102-12632677-images-thumbs&n=13" },
        { name: "USP-S | Извилины", rarity: "classified", price: 200, img: "https://avatars.mds.yandex.net/i?id=c4288e5f58f1778f68020a495932536f41349233-9215651-images-thumbs&n=13" },
        { name: "AK-47 | Кровавый спорт", rarity: "classified", price: 320, img: "https://avatars.mds.yandex.net/i?id=503d55406739a7068e59ddb74dad104c-4429068-images-thumbs&n=13" },
        { name: "M4A1-S | Второй игрок", rarity: "classified", price: 400, img: "https://avatars.mds.yandex.net/i?id=c4483b5d068cd847a27988dc1f098aeca3833c10-4535954-images-thumbs&n=13" },
        { name: "M4A1-S | Decimator", rarity: "classified", price: 280, img: "https://images.steamusercontent.com/ugc/2055370309266914446/6E0793EE8DB9FB257ED0115BE0CF62517FCC4EF9/" },
        { name: "Zeus x27 | Olympus", rarity: "classified", price: 340, img: "https://image-proxy.bo3.gg/uploads/news/46988/title_image/webp-7d2a9467ea16675ce7e95be25bce5ed8.webp.webp?w=1248&h=624" },
        { name: "AWP | Doodle Lore", rarity: "classified", price: 290, img: "https://escorenews.com/media/news/pic-20230216-2144x772-439983494.png" },
        { name: "USP-S | Flashback", rarity: "classified", price: 310, img: "https://i.ytimg.com/vi/7OKqlH8xQSU/maxresdefault.jpg" },
        { name: "MP7 | Abyssal Apparition", rarity: "classified", price: 160, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyEMJn2EHKmKIYlf_Nmk6istiNMPBq7MkIA&s" },

        // === Тайное (covert) ===
        { name: "AK-47 | Огненный змей", rarity: "covert", price: 1200, img: "https://avatars.mds.yandex.net/i?id=6baa62f4af4840226e87a697fdbf4b7f24de1c1c-9094675-images-thumbs&n=13" },
        { name: "M4A4 | Вой", rarity: "covert", price: 1500, img: "https://avatars.mds.yandex.net/i?id=79df7e01d8245d40cb0baf8e0a9903500bd1cc11-5647863-images-thumbs&n=13" },
        { name: "AK-47 | Дикий лотос", rarity: "covert", price: 3000, img: "https://avatars.mds.yandex.net/i?id=8017033af3b808f4f3d0075e8739668c_l-9083254-images-thumbs&n=13" },
        { name: "AWP | Гунгнир", rarity: "covert", price: 6500, img: "https://avatars.mds.yandex.net/i?id=b78101b0b4eb8abccfb768bdf9dd157f3c61a3f0-9099391-images-thumbs&n=13" },
        { name: "AWP | Dragon Lore", rarity: "covert", price: 9000, img: "https://avatars.mds.yandex.net/i?id=21ed62f84d9d6738bb98d28a402f21c7dc289d6c-3695599-images-thumbs&n=13" },
        { name: "AK-47 | Inheritance", rarity: "covert", price: 1400, img: "https://images.steamusercontent.com/ugc/59206217059644704/8165E34F59778E412F6CB047A4FCEC1ACF08D855/?imw=1024&imh=576&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true" },
        { name: "AWP | Chrome Cannon", rarity: "covert", price: 1900, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0Cw_795jjbiQJ2PXyDZSfGZS6c2zqrGOFcQ&s" },
        { name: "AK-47 | Nightwish", rarity: "covert", price: 1650, img: "https://i.redd.it/ak-47-head-shot-vs-nightwish-v0-c6rlqr2ly60g1.jpg?width=3840&format=pjpg&auto=webp&s=cfbb5878676e3dafb1e25effeb64e354d043bf48" },
        { name: "M4A1-S | Nightmare", rarity: "covert", price: 2200, img: "https://pbs.twimg.com/media/G3JtG07XwAABwf2.jpg" },

        // === Особо редкое / Ножи и Перчатки (gold) ===
        { name: "★ Перчатки спецназа | Мраморный градиент", rarity: "gold", price: 2800, img: "https://avatars.mds.yandex.net/i?id=ff2fdac239e0e1ed1dd440b190476cb9f0cb955066934562-12932221-images-thumbs&n=13" },
        { name: "★ Керамбит | Автотроника", rarity: "gold", price: 3500, img: "https://avatars.mds.yandex.net/i?id=3469c05766f23e14e40696837af337f41c4b27a8-5429047-images-thumbs&n=13" },
        { name: "★ Нож-бабочка | Градиент", rarity: "gold", price: 5000, img: "https://avatars.mds.yandex.net/i?id=4fcaca406d46e3c55e4e3a8a71e3c5784df18205-5679824-images-thumbs&n=13" },
        { name: "★ M9 Bayonet | Lore", rarity: "gold", price: 12000, img: "https://avatars.mds.yandex.net/i?id=9093b635e183be5931efa9e5928394d6-4872086-images-thumbs&n=13" },
        { name: "★ Керамбит | Кровавая паутина", rarity: "gold", price: 15000, img: "https://avatars.mds.yandex.net/i?id=afd407f1b9cefbaeb8635ef640632647-5167278-images-thumbs&n=13" },
        { name: "★ Нож Кукри | Fade", rarity: "gold", price: 4200, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzQPcEjcxM7NWjISRzVYCymRQ1hQzkXc7F3g&s" },
        { name: "★ Нож Кукри | Crimson Web", rarity: "gold", price: 3900, img: "https://i.redd.it/l7zdj6ve3b0d1.png" },
        { name: "★ Talon Knife | Fade", rarity: "gold", price: 5500, img: "https://i.redd.it/we2rq9khw5nb1.jpg" },
        { name: "★ Sport Gloves | Amphibious", rarity: "gold", price: 6000, img: "https://preview.redd.it/unboxed-amphibious-sport-gloves-what-are-they-worth-v0-ugjvbeglbxfg1.png?width=2559&format=png&auto=webp&s=e2b23b6fde4b0a8ec873d4d321923273e963b6af" },
        { name: "★ Driver Gloves | Imperial Plaid", rarity: "gold", price: 3200, img: "https://i.ytimg.com/vi/FGP0F8N8eNQ/maxresdefault.jpg" }
    ]
};

// Дефолтное состояние