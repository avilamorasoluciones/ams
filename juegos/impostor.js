const ImpostorGame = (() => {
  const STORAGE_PLAYERS = "impostor_players_v1";
  const STORAGE_USED = "impostor_used_words_final_ok";

  let players = [];
  let usedWords = [];
  let roles = [];
  let selectedCard = null;
  let impostorCounts = {};
  let impostorHintsEnabled = true;

  let currentIndex = 0;
  let starterIndex = 0;
  let secondsLeft = 300;

  let timerId = null;
  let timerRunning = false;
  let timerEndsAt = 0;
  let initialized = false;

  let lastVoteIndex = null;

  function saveSession(screen = document.querySelector(".im-screen.active")?.id || "i-scr-lobby") {
    window.GameSession?.save("impostor", { players, usedWords, roles, selectedCard, currentIndex, starterIndex, secondsLeft, timerRunning, timerEndsAt, lastVoteIndex, impostorCounts, impostorHintsEnabled, screen });
  }

  function $(id) {
    return document.getElementById(id);
  }

  function safeSound(freq, duration, type) {
    if (typeof window.emitSound === "function") {
      window.emitSound(freq, duration, type || "triangle");
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function shuffle(array) {
    const copy = array.slice();

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }

    return copy;
  }

  function getDB() {
    if (typeof DB_IMPOSTOR !== "undefined") {
      return DB_IMPOSTOR;
    }

    if (typeof window.DB_IMPOSTOR !== "undefined") {
      return window.DB_IMPOSTOR;
    }

    return null;
  }

  function getAllCards() {
    const db = getDB();

    if (!db) {
      return [];
    }

    const cards = [];

    Object.keys(db).forEach((category) => {
      const group = db[category];

      if (!Array.isArray(group)) {
        return;
      }

      group.forEach((item) => {
        if (!Array.isArray(item)) {
          return;
        }

        if (item.length < 2) {
          return;
        }

        cards.push({
          category: category,
          word: item[1],
          hint: getImpostorHint({ category, word: item[1] })
        });
      });
    });

    return cards;
  }


  const IMPOSTOR_HINTS = {
    "Manzana":"Fruta crujiente, redonda y muy común en meriendas y postres.",
    "Banano":"Fruta alargada que normalmente se pela antes de comer.",
    "Fresa":"Fruta roja, pequeña y con semillas visibles por fuera.",
    "Sandía":"Fruta grande y jugosa, famosa por su pulpa roja y sus muchas semillas.",
    "Uva":"Fruto pequeño que crece en racimos y puede ser verde o morado.",
    "Piña":"Fruta tropical de cáscara áspera y pulpa amarilla.",
    "Mango":"Fruta tropical dulce y jugosa que suele tener una pepa grande.",
    "Naranja":"Cítrico redondo y anaranjado, conocido por su jugo.",
    "Limón":"Cítrico pequeño y ácido que se usa mucho para dar sabor.",
    "Aguacate":"Fruto verde y cremoso, muy usado en ensaladas y para hacer guacamole.",
    "Tomate":"Fruto rojo y jugoso que aparece en muchas salsas y ensaladas.",
    "Papa":"Tubérculo que crece bajo tierra y aparece en innumerables platos.",
    "Cebolla":"Bulbo que hace llorar al cortarlo y sirve como base de muchos guisos.",
    "Ajo":"Pequeño bulbo de sabor fuerte que se usa para sazonar comidas.",
    "Ají":"Ingrediente que puede ser muy picante y se usa para dar sabor.",
    "Champiñón":"Hongo comestible de sombrero redondo, común en pizzas y salsas.",
    "León":"Gran felino conocido por su melena y por vivir en grupos llamados manadas.",
    "Tigre":"Gran felino rayado que vive de forma solitaria y es excelente cazador.",
    "Panda":"Oso de pelaje blanco y negro famoso por comer bambú.",
    "Koala":"Marsupial australiano que vive en árboles y come principalmente hojas.",
    "Zorro":"Mamífero de hocico fino y cola muy peluda, famoso por su astucia.",
    "Lobo":"Canino salvaje que suele vivir y cazar en manada.",
    "Elefante":"Mamífero enorme reconocido por su trompa y sus grandes orejas.",
    "Jirafa":"Animal muy alto con cuello largo y manchas en el cuerpo.",
    "Cebra":"Animal parecido a un caballo, pero cubierto de rayas blancas y negras.",
    "Canguro":"Marsupial australiano que se desplaza dando grandes saltos.",
    "Caballo":"Animal doméstico que se monta y también se usa para labores del campo.",
    "Vaca":"Animal de granja que produce leche y suele pastar en potreros.",
    "Perro":"Animal doméstico conocido por ser compañero fiel y tener un gran olfato.",
    "Gato":"Animal doméstico independiente que suele ronronear y cazar pequeños animales.",
    "Águila":"Ave rapaz de gran tamaño, famosa por su excelente visión.",
    "Búho":"Ave nocturna de ojos grandes que puede volar casi en silencio.",
    "Delfín":"Mamífero marino inteligente que respira aire y suele vivir en grupos.",
    "Ballena":"Mamífero marino gigantesco que necesita salir a la superficie para respirar.",
    "Pulpo":"Animal marino con ocho brazos y capacidad para cambiar de color.",
    "Cangrejo":"Crustáceo de cuerpo ancho que camina de lado y tiene pinzas.",
    "Tortuga":"Reptil protegido por un caparazón duro que puede vivir en tierra o agua.",
    "Rana":"Anfibio que salta, vive cerca del agua y suele croar.",
    "Serpiente":"Reptil alargado sin patas que se desplaza arrastrándose.",
    "Mariposa":"Insecto de alas coloridas que comienza su vida como oruga.",
    "Abeja":"Insecto que visita flores, produce miel y vive en colonias.",
    "Sol":"Estrella que ilumina y calienta nuestro planeta durante el día.",
    "Nube":"Masa visible de pequeñas gotas de agua o cristales suspendidos en el cielo.",
    "Lluvia":"Agua que cae del cielo en forma de gotas.",
    "Tormenta":"Fenómeno con lluvia fuerte que puede venir acompañado de truenos y relámpagos.",
    "Rayo":"Descarga eléctrica brillante que aparece durante algunas tormentas.",
    "Nieve":"Precipitación formada por cristales de hielo que cae en lugares fríos.",
    "Viento":"Movimiento del aire que podemos sentir aunque no podamos verlo.",
    "Tornado":"Columna de aire que gira violentamente y se extiende desde una tormenta.",
    "Arcoíris":"Arco de colores que puede aparecer cuando la luz atraviesa gotas de agua.",
    "Ola":"Elevación de agua que avanza y rompe con frecuencia cerca de la costa.",
    "Fuego":"Combustión que produce calor, luz y llamas.",
    "Cactus":"Planta adaptada a lugares secos, normalmente con espinas y poca agua.",
    "Rosa":"Flor famosa por sus pétalos y por aparecer mucho en regalos románticos.",
    "Girasol":"Flor grande que suele ser amarilla y se orienta hacia la luz.",
    "Fútbol":"Deporte donde se intenta marcar goles usando principalmente los pies.",
    "Baloncesto":"Deporte de equipo donde se encesta un balón en un aro elevado.",
    "Tenis":"Deporte de raqueta en el que se golpea una pelota sobre una red.",
    "Voleibol":"Deporte de equipo en el que la pelota debe pasar por encima de una red.",
    "Boxeo":"Deporte de combate donde dos personas se golpean usando guantes.",
    "Karate":"Arte marcial de origen japonés basado en golpes, patadas y disciplina.",
    "Golf":"Deporte en el que se intenta llevar una pequeña pelota hasta un hoyo con pocos golpes.",
    "Ajedrez":"Juego de estrategia sobre un tablero de casillas con piezas de dos colores.",
    "Baile":"Actividad artística que consiste en moverse siguiendo ritmo y música.",
    "Natación":"Deporte acuático en el que se avanza usando brazos y piernas.",
    "Silla":"Asiento individual con respaldo, normalmente usado para sentarse.",
    "Sofá":"Mueble acolchado y alargado diseñado para sentarse varias personas.",
    "Cama":"Mueble donde se duerme y se descansa durante la noche.",
    "Puerta":"Elemento que permite entrar o salir de una habitación.",
    "Ventana":"Abertura en una pared que deja entrar luz y aire y puede tener vidrio.",
    "Mesa":"Superficie elevada con patas donde se come, trabaja o se colocan objetos.",
    "Reloj":"Objeto que sirve para medir y mostrar el paso de las horas.",
    "Bombillo":"Dispositivo que produce luz al recibir electricidad.",
    "Llave":"Objeto pequeño que encaja en una cerradura para abrirla o cerrarla.",
    "Espejo":"Superficie que refleja la imagen de quien se coloca delante.",
    "Jabón":"Producto que se usa con agua para limpiar las manos o el cuerpo.",
    "Escoba":"Utensilio con mango y cerdas que sirve para barrer el suelo.",
    "Balde":"Recipiente que se utiliza para transportar o recoger agua.",
    "Libro":"Conjunto de páginas encuadernadas que se lee para obtener información o entretenimiento.",
    "Plato":"Objeto plano donde se sirven los alimentos.",
    "Tenedor":"Utensilio con dientes que ayuda a llevar comida a la boca.",
    "Cuchara":"Utensilio que sirve para recoger alimentos líquidos o blandos.",
    "Cuchillo":"Utensilio con filo que sirve para cortar alimentos.",
    "Vaso":"Recipiente abierto que normalmente se usa para beber líquidos.",
    "Taza":"Recipiente pequeño con asa que suele utilizarse para bebidas calientes.",
    "Sartén":"Utensilio de cocina con mango y una superficie donde se cocinan alimentos.",
    "Automóvil":"Vehículo de cuatro ruedas diseñado principalmente para transportar personas.",
    "Taxi":"Vehículo que lleva pasajeros a cambio de un pago.",
    "Bicicleta":"Vehículo de dos ruedas que se mueve mediante pedales.",
    "Motocicleta":"Vehículo de dos ruedas con motor y asiento para el conductor.",
    "Tren":"Vehículo ferroviario que se desplaza sobre rieles.",
    "Metro":"Sistema de transporte urbano que usa trenes para mover pasajeros por la ciudad.",
    "Avión":"Vehículo que vuela gracias a sus alas y motores y transporta pasajeros.",
    "Helicóptero":"Aeronave que se sostiene en el aire mediante grandes aspas giratorias.",
    "Pizza":"Comida redonda de masa horneada cubierta normalmente con salsa y queso.",
    "Hamburguesa":"Comida de pan que normalmente lleva una carne en el centro y otros ingredientes.",
    "Taco":"Comida servida en una tortilla doblada con distintos rellenos.",
    "Sándwich":"Comida preparada con pan que encierra ingredientes como carne, queso o verduras.",
    "Ensalada":"Plato que combina distintos vegetales y suele servirse con aderezo.",
    "Espagueti":"Pasta larga que suele acompañarse con salsa.",
    "Sushi":"Comida japonesa conocida por preparaciones de arroz combinadas con otros ingredientes.",
    "Empanada":"Preparación de masa rellena que puede cocinarse frita u horneada.",
    "Queso":"Alimento elaborado a partir de leche, disponible en muchas variedades.",
    "Dona":"Postre pequeño y redondo, normalmente con un agujero en el centro.",
    "Galleta":"Alimento dulce y horneado que suele ser pequeño y crujiente.",
    "Pastel":"Postre horneado que suele servirse en celebraciones.",
    "Helado":"Postre frío y cremoso que normalmente se conserva congelado.",
    "Chocolate":"Dulce elaborado a partir de cacao.",
    "Miel":"Alimento espeso y dulce que producen las abejas.",
    "Leche":"Alimento líquido producido por mamíferos y muy común en el desayuno.",
    "Café":"Bebida oscura y aromática preparada con granos tostados.",
    "Gaseosa":"Bebida dulce que contiene burbujas.",
    "Jugo":"Bebida líquida obtenida normalmente de frutas.",
    "Guitarra":"Instrumento de cuerda que se toca pulsando o rasgueando sus cuerdas.",
    "Violín":"Instrumento de cuerda que se toca con un arco.",
    "Piano":"Instrumento de teclas que produce sonidos mediante mecanismos internos.",
    "Tambor":"Instrumento de percusión que se toca golpeando una membrana.",
    "Acordeón":"Instrumento de fuelle muy asociado con la música popular y el vallenato.",
    "Flauta":"Instrumento de viento alargado que se toca soplando por una abertura.",
    "Maracas":"Instrumentos pequeños que se agitan para producir ritmos.",
    "Arpa":"Instrumento grande de cuerda que se toca con los dedos.",
    "Hospital":"Centro de atención médica donde se diagnostican y tratan enfermedades.",
    "Escuela":"Lugar donde estudiantes reciben clases y aprenden distintas materias.",
    "Banco":"Institución donde se guardan, prestan o administran recursos y dinero.",
    "Hotel":"Lugar de alojamiento donde las personas pagan por dormir y recibir servicios.",
    "Supermercado":"Establecimiento grande donde se compran alimentos y productos para el hogar.",
    "Fábrica":"Lugar donde se fabrican productos mediante máquinas y trabajadores.",
    "Castillo":"Edificación histórica asociada con reyes, murallas y grandes salones.",
    "Iglesia":"Lugar destinado al culto religioso y normalmente asociado al cristianismo.",
    "Estadio":"Lugar grande con graderías donde se realizan partidos y espectáculos.",
    "Playa":"Lugar de arena o costa donde la gente va a bañarse o tomar el sol.",
    "Montaña":"Elevación natural del terreno mucho más alta que las zonas que la rodean.",
    "Volcán":"Montaña que puede expulsar lava, ceniza y gases desde su interior.",
    "Desierto":"Región muy seca donde llueve poco y predominan grandes extensiones de arena o roca.",
    "Isla":"Porción de tierra rodeada de agua por todos sus lados.",
    "Parque":"Espacio público donde la gente puede caminar, jugar o descansar.",
    "Cine":"Lugar donde se proyectan películas en una pantalla grande para el público.",
    "Aeropuerto":"Lugar donde despegan y aterrizan aviones y funcionan terminales para pasajeros.",
    "Médico":"Profesional de la salud que diagnostica enfermedades y atiende pacientes.",
    "Estudiante":"Persona que asiste a clases para aprender y formarse.",
    "Profesor":"Persona que enseña conocimientos y guía a sus estudiantes.",
    "Juez":"Persona encargada de decidir asuntos legales en un tribunal.",
    "Agricultor":"Persona que trabaja cultivando la tierra o criando animales para producir alimentos.",
    "Chef":"Profesional que prepara alimentos y trabaja en una cocina.",
    "Mecánico":"Profesional que repara y mantiene vehículos y máquinas.",
    "Bombero":"Persona especializada en apagar incendios y rescatar en emergencias.",
    "Policía":"Agente encargado de hacer cumplir la ley y proteger a la comunidad.",
    "Detective":"Persona que investiga hechos para descubrir qué ocurrió.",
    "Piloto":"Persona entrenada para controlar y conducir una aeronave.",
    "Abogado":"Profesional especializado en asesorar y representar en asuntos legales.",
    "Fotógrafo":"Persona que utiliza una cámara para crear imágenes.",
    "Dentista":"Profesional de la salud especializado en los dientes y la boca.",
    "Escritor":"Persona que crea textos como libros, cuentos, artículos o guiones.",
    "Camiseta":"Prenda de vestir de la parte superior del cuerpo, normalmente con mangas cortas.",
    "Camisa":"Prenda de vestir que suele tener cuello y botones.",
    "Pantalón":"Prenda que cubre las piernas y normalmente llega hasta los tobillos.",
    "Vestido":"Prenda de una sola pieza que puede ser casual o elegante.",
    "Medias":"Prenda que cubre los pies y suele usarse dentro de los zapatos.",
    "Zapatillas":"Calzado deportivo cómodo para caminar, correr o hacer ejercicio.",
    "Tacones":"Calzado con una parte elevada bajo el talón, común en ocasiones formales.",
    "Botas":"Calzado resistente que cubre gran parte del pie.",
    "Corona":"Adorno que representa autoridad o realeza y se coloca sobre la cabeza.",
    "Sombrero":"Accesorio para cubrir la cabeza, normalmente con ala.",
    "Gorra":"Gorro de tela con visera que se usa para protegerse del sol.",
    "Maleta":"Bolso o equipaje usado para transportar ropa y objetos durante un viaje.",
    "Gafas":"Objeto con lentes que ayuda a ver mejor o protege los ojos.",
    "Anillo":"Joya circular que normalmente se lleva en un dedo.",
    "Bufanda":"Prenda alargada que se usa alrededor del cuello para protegerse del frío.",
    "Guantes":"Prenda que cubre las manos y ayuda a mantenerlas calientes.",
    "Corbata":"Prenda estrecha que se lleva alrededor del cuello y es típica de ropa formal.",
    "Sombrilla":"Objeto plegable que protege de la lluvia o del sol.",
    "Martillo":"Herramienta con cabeza pesada que sirve para golpear, clavar o romper.",
    "Hacha":"Herramienta con una hoja pesada que se usa para cortar madera o ramas.",
    "Tornillo":"Pieza metálica roscada que se usa para sujetar objetos.",
    "Cadena":"Conjunto de eslabones unidos que sirve para sujetar o asegurar.",
    "Imán":"Objeto que atrae ciertos metales mediante una fuerza invisible.",
    "Pistola":"Arma de fuego pequeña que se puede sostener con una mano.",
    "Bomba":"Objeto que puede contener material explosivo y producir una fuerte detonación.",
    "Dinamita":"Material explosivo conocido por su uso histórico en minería y demolición.",
    "Destornillador":"Herramienta con punta que gira para apretar o quitar tornillos.",
    "Escalera":"Objeto con peldaños que permite alcanzar lugares altos.",
    "Regla":"Instrumento recto con marcas que sirve para medir y dibujar líneas.",
    "Billete":"Dinero de papel utilizado como medio de pago.",
    "Moneda":"Objeto metálico de pequeño tamaño usado como dinero.",
    "Tarjeta":"Medio de pago de plástico que permite comprar o retirar dinero.",
    "Diamante":"Piedra preciosa muy dura y transparente, famosa por su brillo.",
    "Alcancía":"Recipiente usado para guardar monedas y ahorrar dinero.",
    "Pérdida":"Resultado desfavorable en el que se pierde dinero, puntos o una oportunidad.",
    "Ganancia":"Resultado favorable en el que se obtiene dinero, puntos o beneficio.",
    "Recibo":"Documento que demuestra que se realizó un pago o una compra.",
    "Candado":"Dispositivo que impide abrir algo sin una llave o combinación.",
    "Bola":"Objeto redondo que puede rebotar, rodar o usarse en juegos.",
    "Varita":"Objeto asociado con la magia que suele aparecer en manos de un mago.",
    "Escudo":"Objeto protector que se lleva para bloquear golpes o ataques.",
    "Espada":"Arma blanca larga con una hoja y un mango.",
    "Barbería":"Lugar donde se corta, afeita y arregla el cabello.",
    "Peluche":"Juguete suave y acolchado que suele representar un animal o personaje.",
    "Confeti":"Pequeños trozos de papel que se lanzan para decorar celebraciones.",
    "Globo":"Objeto ligero y redondo que se infla y se usa mucho en fiestas.",
    "Cerebro":"Órgano dentro de la cabeza encargado de controlar el cuerpo y procesar información.",
    "Corazón":"Órgano muscular que bombea sangre por todo el cuerpo.",
    "Pulmón":"Órgano encargado de tomar oxígeno del aire y expulsar dióxido de carbono.",
    "Diente":"Parte dura de la boca que sirve para masticar alimentos.",
    "Hueso":"Estructura rígida que forma parte del esqueleto y sostiene el cuerpo.",
    "Ojo":"Órgano que permite captar imágenes y percibir la luz.",
    "Oreja":"Órgano que permite escuchar sonidos y ayuda al equilibrio.",
    "Nariz":"Órgano del rostro que permite oler y participa en la respiración.",
    "Lengua":"Órgano muscular que ayuda a hablar, saborear y mover alimentos.",
    "Boca":"Parte del cuerpo que se usa para hablar y comer.",
    "Curita":"Pequeño material adhesivo que se coloca sobre una herida superficial.",
    "Estetoscopio":"Instrumento médico usado para escuchar sonidos del corazón y los pulmones.",
    "Pastilla":"Medicamento sólido que normalmente se traga para tratar una enfermedad o síntoma.",
    "Jeringa":"Instrumento médico con aguja usado para aplicar o extraer líquidos.",
    "Termómetro":"Instrumento que sirve para medir la temperatura.",
    "Planeta":"Cuerpo celeste que gira alrededor de una estrella.",
    "Luna":"Satélite natural de la Tierra que vemos cambiar de forma durante el mes.",
    "Saturno":"Planeta famoso por sus grandes anillos.",
    "Estrella":"Cuerpo celeste que produce su propia luz.",
    "Cometa":"Cuerpo rocoso que viaja por el espacio y puede formar una cola brillante.",
    "Lápiz":"Utensilio con una mina que se usa para escribir y dibujar.",
    "Pluma":"Instrumento de escritura que normalmente contiene tinta.",
    "Bolígrafo":"Instrumento de escritura de tinta con una punta metálica.",
    "Pincel":"Herramienta con cerdas que sirve para aplicar pintura.",
    "Calendario":"Objeto que muestra los días, semanas y meses del año.",
    "Tijeras":"Herramienta de dos hojas afiladas que sirve para cortar.",
    "Cereza":"Fruta pequeña y redonda, normalmente roja, con una sola semilla grande en el centro.",
    "Durazno":"Fruta de piel aterciopelada, pulpa jugosa y una pepa grande en el centro.",
    "Kiwi":"Fruta pequeña de piel marrón y pulpa verde con muchas semillas negras.",
    "Zanahoria":"Hortaliza alargada y generalmente naranja que crece bajo tierra.",
    "Brócoli":"Verdura verde formada por pequeños ramilletes que parecen arbolitos.",
    "Maíz":"Cereal que crece en mazorcas y cuyos granos pueden ser amarillos, blancos o de otros colores.",
    "Pepino":"Hortaliza alargada, verde y muy crujiente, común en ensaladas.",
    "Lechuga":"Vegetal de hojas verdes y crujientes que se usa mucho en ensaladas.",
    "Coco":"Fruto tropical de cáscara dura que contiene agua y pulpa blanca.",
    "Melón":"Fruta grande y dulce de pulpa jugosa, normalmente de color claro o anaranjado.",
    "Pera":"Fruta dulce con forma característica de lágrima y pulpa jugosa.",
    "Berenjena":"Hortaliza de piel normalmente morada y forma alargada, usada en muchos platos.",
    "Calabaza":"Fruto grande de cáscara dura, asociado también con decoraciones de Halloween.",
    "Maní":"Semilla comestible que crece bajo tierra y se consume tostada, salada o en crema.",
    "Oso":"Mamífero grande de cuerpo robusto que puede hibernar y vive en distintos hábitats.",
    "Mono":"Primate ágil que suele trepar árboles y tiene manos adaptadas para agarrarse.",
    "Gorila":"Primate grande y muy fuerte que vive en los bosques de África.",
    "Rinoceronte":"Mamífero enorme de piel gruesa que tiene uno o dos cuernos sobre el hocico.",
    "Hipopótamo":"Mamífero enorme que pasa mucho tiempo en el agua y tiene una boca muy grande.",
    "Ciervo":"Mamífero de patas delgadas; los machos de muchas especies tienen astas.",
    "Jabalí":"Cerdo salvaje de cuerpo robusto, hocico fuerte y colmillos visibles.",
    "Camello":"Animal del desierto famoso por sus jorobas y su capacidad para soportar largos periodos sin agua.",
    "Llama":"Camélido sudamericano de cuello largo y abundante lana.",
    "Leopardo":"Felino ágil de pelaje con manchas que puede trepar árboles con facilidad.",
    "Cerdo":"Animal de granja de hocico corto que también es conocido por su afición a revolcarse en el barro.",
    "Oveja":"Animal de granja cubierto de lana que suele vivir en rebaños.",
    "Cabra":"Animal de granja ágil, con cuernos en muchas especies y conocido por comer gran variedad de plantas.",
    "Conejo":"Mamífero pequeño de orejas largas y patas traseras fuertes.",
    "Ratón":"Pequeño roedor de cuerpo diminuto, orejas redondas y cola larga.",
    "Tejón":"Mamífero de patas cortas y cuerpo robusto, conocido por excavar madrigueras.",
    "Ardilla":"Roedor pequeño y ágil que suele trepar árboles y almacenar alimento.",
    "Erizo":"Pequeño mamífero cubierto de púas que puede hacerse una bola cuando se siente amenazado.",
    "Pato":"Ave acuática con pico ancho y patas adaptadas para nadar.",
    "Pingüino":"Ave que no vuela y está adaptada para nadar en aguas frías.",
    "Pájaro":"Animal con plumas, alas y pico que pertenece al grupo de las aves.",
    "Gallo":"Ave doméstica macho conocida por su cresta y por cantar al amanecer.",
    "Paloma":"Ave común que suele verse en plazas y ciudades y puede orientarse a grandes distancias.",
    "Flamenco":"Ave de patas largas y plumaje rosado que suele vivir cerca de aguas poco profundas.",
    "Tiburón":"Pez marino de cuerpo alargado, varias filas de dientes y gran capacidad para detectar presas.",
    "Calamar":"Animal marino de cuerpo alargado y tentáculos que se desplaza expulsando agua.",
    "Langosta":"Crustáceo marino de caparazón duro y grandes pinzas.",
    "Cocodrilo":"Reptil grande de hocico alargado que vive cerca de ríos, lagos y zonas pantanosas.",
    "Murciélago":"Mamífero capaz de volar que suele descansar colgado boca abajo.",
    "Mariquita":"Pequeño escarabajo redondo, muchas veces rojo con puntos negros.",
    "Hormiga":"Insecto social que vive en colonias y puede transportar objetos mucho más pesados que ella.",
    "Mosquito":"Insecto pequeño que zumba y cuya hembra de algunas especies se alimenta de sangre.",
    "Escorpión":"Arácnido con pinzas delanteras y una cola curvada terminada en aguijón.",
    "Caracol":"Molusco de movimiento lento que lleva una concha en espiral sobre su cuerpo.",
    "Tronco":"Parte gruesa y principal del tallo de un árbol, normalmente cubierta de corteza.",
    "Pino":"Árbol de hojas en forma de agujas que produce piñas y suele mantenerse verde todo el año.",
    "Hoja":"Parte generalmente plana y verde de una planta que ayuda a producir su alimento.",
    "Trébol":"Planta pequeña cuyas hojas suelen tener tres partes; algunas variedades tienen cuatro.",
    "Planta":"Ser vivo que normalmente produce su propio alimento usando luz, agua y dióxido de carbono.",
    "Béisbol":"Deporte de bate y pelota en el que los jugadores corren por bases después de golpear.",
    "Sóftbol":"Deporte parecido al béisbol que usa una pelota más grande y se juega en un campo diferente.",
    "Rugby":"Deporte de contacto en el que se avanza con un balón ovalado y se puede llevar con las manos.",
    "Frisbee":"Disco plástico que se lanza por el aire y se atrapa con las manos.",
    "Hockey":"Deporte en el que se usa un palo para mover un disco o una pelota hacia una portería.",
    "Pesca":"Actividad que consiste en capturar peces usando herramientas como caña, anzuelo o redes.",
    "Buceo":"Actividad de sumergirse bajo el agua usando técnicas y, muchas veces, equipo especial.",
    "Esquí":"Deporte de nieve en el que se baja o se avanza sobre dos tablas largas sujetas a los pies.",
    "Ciclismo":"Actividad o deporte que se practica desplazándose sobre una bicicleta.",
    "Escalada":"Actividad de subir paredes, rocas o estructuras usando manos y pies.",
    "Gimnasia":"Deporte basado en movimientos corporales, equilibrio, flexibilidad, fuerza y acrobacias.",
    "Bolos":"Juego en el que se lanza una bola pesada por una pista para derribar pinos.",
    "Dardos":"Juego en el que se lanzan pequeños proyectiles con punta hacia una diana.",
    "Vela":"Deporte o actividad náutica que utiliza el viento para impulsar una embarcación.",
    "Caja":"Recipiente con forma normalmente rectangular que sirve para guardar o transportar objetos.",
    "Cuadro":"Obra visual que suele estar pintada o impresa y se coloca en una pared.",
    "Alarma":"Dispositivo que emite un sonido o aviso para despertar o alertar.",
    "Peineta":"Accesorio con dientes que se coloca en el cabello para peinarlo o sujetarlo.",
    "Timbre":"Dispositivo que produce un sonido cuando alguien lo pulsa para avisar que ha llegado.",
    "Camioneta":"Vehículo más grande que un automóvil, normalmente con espacio para carga o varias personas.",
    "Autobús":"Vehículo grande que transporta a muchos pasajeros y sigue rutas determinadas.",
    "Patrulla":"Vehículo utilizado por la policía para recorrer una zona y atender situaciones.",
    "Ambulancia":"Vehículo equipado para trasladar y atender personas enfermas o heridas.",
    "Tractor":"Vehículo de trabajo agrícola diseñado para mover herramientas, remolques y maquinaria.",
    "Scooter":"Vehículo pequeño, normalmente de dos ruedas, que puede ser eléctrico o impulsado con el pie.",
    "Velero":"Embarcación que se desplaza principalmente aprovechando la fuerza del viento sobre sus velas.",
    "Yate":"Embarcación destinada principalmente a paseos, recreación o viajes privados.",
    "Crucero":"Gran barco de pasajeros diseñado para viajes turísticos con alojamiento y entretenimiento.",
    "Canoa":"Embarcación estrecha y ligera que normalmente se mueve con remos.",
    "OVNI":"Objeto visto en el cielo que no ha sido identificado en el momento de observarlo.",
    "Patineta":"Tabla con ruedas sobre la que una persona se desplaza manteniendo el equilibrio.",
    "Panqueque":"Preparación redonda y plana hecha con una mezcla que se cocina en una sartén.",
    "Waffle":"Masa cocinada en una plancha que deja un patrón de cuadros y suele servirse dulce.",
    "Costilla":"Corte de carne que contiene hueso y suele cocinarse asado, al horno o a la parrilla.",
    "Filete":"Porción de carne o pescado cortada en una pieza que suele cocinarse a la plancha o parrilla.",
    "Tocino":"Tiras de carne de cerdo curada que suelen freírse hasta quedar crujientes.",
    "Dulce":"Alimento de sabor azucarado que normalmente se come como golosina o postre.",
    "Té":"Bebida caliente preparada al infusionar hojas o hierbas en agua.",
    "Saxofón":"Instrumento de viento metálico con una boquilla y una forma curva característica.",
    "Trompeta":"Instrumento de viento metálico que produce sonidos al hacer vibrar los labios en una boquilla.",
    "Banjo":"Instrumento de cuerda con cuerpo circular y un mástil largo, asociado a la música folclórica.",
    "Campana":"Objeto que produce un sonido fuerte y resonante al ser golpeado o moverse su badajo.",
    "Megáfono":"Aparato que amplifica la voz para que se escuche a distancia.",
    "Campamento":"Lugar o actividad de pasar tiempo al aire libre, normalmente usando carpas o refugios.",
    "Monumento":"Construcción o escultura creada para recordar a una persona, hecho o acontecimiento.",
    "Circo":"Espectáculo que puede incluir payasos, acrobacias, malabaristas y otros artistas.",
    "Montaña rusa":"Atracción de parque de diversiones formada por un recorrido de rieles con subidas, bajadas y curvas.",
    "Fuente":"Estructura que hace brotar o circular agua, normalmente con una función decorativa.",
    "Edificio":"Construcción grande con espacios interiores destinados a vivienda, trabajo u otros usos.",
    "Barrio":"Zona de una ciudad formada por calles, viviendas y servicios cercanos.",
    "Puerto":"Lugar junto al mar o un río donde embarcaciones llegan, salen o cargan mercancías.",
    "Obrero":"Trabajador que realiza labores manuales, especialmente en construcción o industria.",
    "Oficinista":"Persona que realiza tareas administrativas y de escritorio en una oficina.",
    "Científico":"Persona que estudia fenómenos del mundo mediante investigación, observación y experimentos.",
    "Cantante":"Persona que utiliza su voz para interpretar canciones.",
    "Pintor":"Artista que crea imágenes aplicando pintura sobre una superficie.",
    "Astronauta":"Persona entrenada para viajar y trabajar fuera de la Tierra en el espacio.",
    "Guardia":"Persona encargada de vigilar y proteger un lugar o personas.",
    "Constructor":"Trabajador o profesional que participa en la construcción de edificios y otras estructuras.",
    "Mesero":"Persona que atiende a los clientes y lleva comida y bebidas en un restaurante.",
    "Peluquero":"Profesional que corta, peina, arregla y estiliza el cabello.",
    "Diseñador":"Persona que crea la apariencia y la solución visual o funcional de productos y proyectos.",
    "Carpintero":"Profesional que trabaja principalmente con madera para fabricar o reparar objetos y estructuras.",
    "Albañil":"Trabajador especializado en construir paredes y estructuras usando materiales como ladrillo y cemento.",
    "Conserje":"Persona encargada del mantenimiento, cuidado o vigilancia de un edificio.",
    "Salvavidas":"Persona entrenada para prevenir accidentes y rescatar a quienes tienen problemas en el agua.",
    "Locutor":"Persona que habla frente a un micrófono en radio, televisión o eventos.",
    "Blusa":"Prenda de vestir para la parte superior del cuerpo, normalmente asociada a ropa femenina.",
    "Pantaloneta":"Prenda corta que cubre desde la cintura hasta parte de las piernas y se usa mucho para deporte.",
    "Abrigo":"Prenda gruesa que se usa encima de la ropa para protegerse del frío.",
    "Maletín":"Bolso estructurado que se usa para transportar documentos, computador u objetos de trabajo.",
    "Abanico":"Objeto que se mueve con la mano para producir una corriente de aire.",
    "Pico":"Herramienta de metal con una punta fuerte que sirve para romper o excavar tierra y roca.",
    "Serrucho":"Herramienta con una hoja dentada que se mueve a mano para cortar madera.",
    "Llave inglesa":"Herramienta ajustable que sirve para apretar o aflojar tuercas y piezas metálicas.",
    "Caja de herramientas":"Recipiente donde se guardan organizadas herramientas para reparar o construir.",
    "Escuadra":"Instrumento con forma de ángulo que se usa para medir o dibujar líneas rectas y perpendiculares.",
    "Gancho":"Objeto curvo diseñado para sujetar, colgar o enganchar cosas.",
    "Tubo":"Objeto largo y hueco por dentro que puede servir para transportar líquidos, aire o cables.",
    "Bolsa":"Recipiente flexible con asas o abertura que se usa para transportar objetos.",
    "Buzón":"Compartimento donde se reciben cartas y otros envíos postales.",
    "Vasija":"Recipiente generalmente de barro, cerámica u otro material, usado para contener líquidos u objetos.",
    "Rosario":"Objeto formado por cuentas que se utiliza tradicionalmente para rezar ciertas oraciones.",
    "Moño":"Lazo hecho con una cinta que se usa como adorno o para sujetar el cabello.",
    "Crayón":"Barra de cera o material similar que se usa principalmente para colorear y dibujar.",
    "Nota":"Mensaje breve escrito para recordar algo, comunicar información o acompañar un objeto.",
    "Carpeta":"Objeto o archivo destinado a guardar y organizar documentos.",
    "Clip":"Pequeña pieza de metal que sirve para mantener varias hojas de papel juntas.",
    "Chincheta":"Pequeño objeto con punta que se usa para fijar papeles en una pared o tablero.",
    "Cuaderno":"Conjunto de hojas encuadernadas que se utiliza para escribir, tomar apuntes o dibujar.",
  };

  const IMPOSTOR_SOFT_GROUPS = [
    {
      words: new Set("Manzana Banano Fresa Sandía Uva Piña Mango Naranja Limón Cereza Durazno Kiwi Aguacate Tomate Zanahoria Brócoli Maíz Papa Cebolla Ajo Pepino Lechuga Ají Champiñón Coco Melón Pera Berenjena Calabaza Maní".split(" ")),
      clues: [
        "Suele aparecer en meriendas, recetas o bebidas.",
        "Es bastante común en la cocina cotidiana.",
        "Tiene mucha presencia en comidas preparadas en casa.",
        "Probablemente lo hayas encontrado en una lonchera o en una mesa.",
        "Es de esas cosas que aparecen con frecuencia al hablar de comida."
      ]
    },
    {
      words: new Set("León Tigre Oso Panda Koala Zorro Lobo Mono Gorila Elefante Rinoceronte Hipopótamo Jirafa Cebra Ciervo Jabalí Camello Llama Canguro Leopardo Caballo Cerdo Vaca Oveja Cabra Perro Gato Conejo Ratón Tejón Ardilla Erizo".split(" ")),
      clues: [
        "Es algo que podrías encontrar en un entorno natural.",
        "Tiene relación con animales y suele reconocerse por su comportamiento.",
        "Es común hablar de esto cuando se mencionan hábitats o naturaleza.",
        "Puede aparecer tanto en documentales como en historias.",
        "Su entorno y forma de vida dicen bastante sobre él."
      ]
    },
    {
      words: new Set("Águila Búho Pato Pingüino Pájaro Gallo Paloma Flamenco".split(" ")),
      clues: [
        "Tiene relación con animales que pasan buena parte del tiempo en el aire o cerca de él.",
        "Es algo que suele asociarse con parques, campo o naturaleza.",
        "Su comportamiento suele llamar la atención cuando aparece.",
        "Es común verlo mencionado al hablar de fauna.",
        "Puede encontrarse en distintos ambientes, dependiendo de la especie."
      ]
    },
    {
      words: new Set("Tiburón Delfín Ballena Pulpo Calamar Langosta Cangrejo Tortuga Cocodrilo".split(" ")),
      clues: [
        "Tiene relación con ambientes donde hay bastante agua.",
        "Suele aparecer cuando se habla de fauna acuática.",
        "Es algo que mucha gente relaciona con el mar o zonas húmedas.",
        "Su entorno es una parte importante para reconocerlo.",
        "Puede aparecer en documentales de naturaleza."
      ]
    },
    {
      words: new Set("Rana Serpiente Murciélago Mariposa Abeja Mariquita Hormiga Mosquito Escorpión Caracol".split(" ")),
      clues: [
        "Es pequeño o suele encontrarse en ambientes donde hay otros animales de este tipo.",
        "Es común encontrarlo mencionado cuando se habla de naturaleza.",
        "Su comportamiento suele ser más interesante que su apariencia.",
        "Puede aparecer cerca de plantas, tierra o agua.",
        "Es algo que muchas personas reconocen aunque no lo vean todos los días."
      ]
    },
    {
      words: new Set("Sol Nube Lluvia Tormenta Rayo Nieve Viento Tornado Arcoíris Ola Fuego".split(" ")),
      clues: [
        "Es algo que forma parte de situaciones que vemos a nuestro alrededor.",
        "Puede cambiar bastante según el lugar y el momento.",
        "Es común hablar de esto al describir lo que está pasando afuera.",
        "Tiene relación con fenómenos que pueden observarse directamente.",
        "Probablemente lo hayas usado alguna vez para describir un día o un paisaje."
      ]
    },
    {
      words: new Set("Tronco Cactus Pino Hoja Trébol Rosa Girasol Planta".split(" ")),
      clues: [
        "Tiene relación con el mundo vegetal.",
        "Suele encontrarse en jardines, parques o espacios naturales.",
        "Es algo que cambia según la estación, el lugar o las condiciones.",
        "Su aspecto suele ser una de las primeras cosas que llama la atención.",
        "Tiene bastante relación con jardines y naturaleza."
      ]
    },
    {
      words: new Set("Fútbol Baloncesto Béisbol Sóftbol Tenis Voleibol Rugby Frisbee Hockey Boxeo Karate Pesca Buceo Golf Esquí Ciclismo Escalada Gimnasia Bolos Dardos Ajedrez Baile Natación".split(" ")),
      clues: [
        "Es una actividad que suele tener reglas y una forma específica de practicarla.",
        "Puede aparecer tanto en clases como en competencias.",
        "Normalmente requiere cierta técnica o práctica.",
        "Es común verlo asociado con entrenamientos o torneos.",
        "Tiene relación con una actividad que muchas personas practican por diversión o competencia."
      ]
    },
    {
      words: new Set("Silla Sofá Cama Puerta Ventana Mesa Reloj Bombillo Vela Llave Espejo Jabón Escoba Balde Caja Cuadro Libro Plato Tenedor Cuchara Cuchillo Vaso Taza Sartén Alarma Peineta Timbre".split(" ")),
      clues: [
        "Es algo que probablemente haya en una casa.",
        "Es un objeto bastante cotidiano.",
        "Puede aparecer en una habitación, cocina o espacio de uso diario.",
        "Es algo que normalmente usamos sin pensar demasiado en ello.",
        "Forma parte de cosas que suelen estar a nuestro alrededor todos los días."
      ]
    },
    {
      words: new Set("Automóvil Taxi Camioneta Autobús Patrulla Ambulancia Tractor Bicicleta Scooter Motocicleta Tren Metro Avión Helicóptero Velero Yate Crucero Canoa OVNI Patineta".split(" ")),
      clues: [
        "Tiene relación con desplazarse de un lugar a otro.",
        "Suele aparecer cuando se habla de viajes o transporte.",
        "Puede llevar personas, objetos o cumplir alguna función específica.",
        "Es algo que probablemente hayas visto en una calle, carretera, estación o viaje.",
        "Su uso suele estar relacionado con moverse o llegar a otro lugar."
      ]
    },
    {
      words: new Set("Hamburguesa Pizza Taco Sándwich Ensalada Espagueti Sushi Empanada Panqueque Waffle Queso Costilla Filete Tocino Dona Galleta Pastel Helado Chocolate Dulce Miel Leche Café Té Gaseosa Jugo".split(" ")),
      clues: [
        "Puede aparecer en una comida, merienda o reunión.",
        "Es algo que suele relacionarse con momentos de comer o compartir.",
        "Tiene bastante presencia en restaurantes o cocinas.",
        "Es fácil encontrarlo en menús o preparaciones caseras.",
        "Suele formar parte de alguna comida o antojo."
      ]
    },
    {
      words: new Set("Guitarra Violín Piano Tambor Saxofón Trompeta Acordeón Banjo Flauta Maracas Arpa Campana Megáfono".split(" ")),
      clues: [
        "Tiene relación con producir o acompañar sonidos.",
        "Puede aparecer en presentaciones, ensayos o celebraciones.",
        "Suele necesitar cierta técnica para usarse bien.",
        "Es común relacionarlo con música, ritmo o comunicación.",
        "Su sonido suele ser una parte importante de cómo se reconoce."
      ]
    },
    {
      words: new Set(["Hospital", "Escuela", "Banco", "Hotel", "Supermercado", "Fábrica", "Castillo", "Iglesia", "Estadio", "Playa", "Campamento", "Montaña", "Volcán", "Desierto", "Isla", "Parque", "Monumento", "Circo", "Montaña rusa", "Cine", "Fuente", "Edificio", "Barrio", "Puerto", "Aeropuerto", "Barbería"]),
      clues: [
        "Es un lugar que puedes visitar por una razón específica.",
        "Su función suele depender mucho de las personas que van allí.",
        "Es común mencionarlo cuando se habla de lugares o destinos.",
        "Tiene relación con un espacio físico reconocible.",
        "Probablemente lo hayas visto o escuchado mencionar en situaciones cotidianas."
      ]
    },
    {
      words: new Set("Médico Estudiante Profesor Juez Agricultor Chef Mecánico Obrero Oficinista Científico Cantante Pintor Astronauta Bombero Policía Detective Guardia Constructor Mesero Peluquero Piloto Diseñador Abogado Fotógrafo Dentista Carpintero Albañil Conserje Salvavidas Escritor Locutor".split(" ")),
      clues: [
        "Es una persona asociada a una actividad o trabajo específico.",
        "Normalmente requiere ciertas habilidades para hacerlo bien.",
        "Suele aparecer en situaciones relacionadas con su profesión.",
        "Es un rol que muchas personas reconocen por lo que hace.",
        "Su trabajo suele ser la mejor pista para entenderlo."
      ]
    },
    {
      words: new Set("Camiseta Camisa Blusa Pantalón Pantaloneta Abrigo Vestido Medias Zapatillas Tacones Botas Corona Sombrero Gorra Maleta Gafas Anillo Maletín Abanico Bufanda Guantes Corbata Sombrilla Moño".split(" ")),
      clues: [
        "Tiene relación con la forma en que una persona se viste o lleva sus cosas.",
        "Puede formar parte de un conjunto de uso personal.",
        "Su apariencia suele cambiar según el estilo o la ocasión.",
        "Es algo que puede aparecer en un armario o durante un viaje.",
        "Normalmente se usa, se lleva o se coloca sobre alguna parte del cuerpo."
      ]
    },
    {
      words: new Set(["Martillo", "Hacha", "Pico", "Tornillo", "Cadena", "Imán", "Pistola", "Bomba", "Dinamita", "Serrucho", "Llave inglesa", "Destornillador", "Escalera", "Caja de herramientas", "Escuadra", "Regla", "Gancho", "Tubo"]),
      clues: [
        "Es algo que suele aparecer en trabajos manuales o de reparación.",
        "Normalmente tiene un uso práctico bastante concreto.",
        "Puede formar parte del equipo de alguien que arregla o construye cosas.",
        "Suele encontrarse entre objetos de trabajo.",
        "Su utilidad depende bastante de cómo se utilice."
      ]
    },
    {
      words: new Set("Billete Moneda Tarjeta Diamante Bolsa Alcancía Pérdida Ganancia Recibo Buzón Candado Bola Varita Escudo Espada Vasija Rosario Peluche Confeti Globo".split(" ")),
      clues: [
        "Es algo que puede aparecer en situaciones bastante diferentes.",
        "Suele asociarse con objetos, acciones o momentos de la vida cotidiana.",
        "Puede tener un uso concreto dependiendo del contexto.",
        "Es fácil encontrarlo en historias, conversaciones o situaciones comunes.",
        "Su significado puede cambiar bastante según cómo se use."
      ]
    },
    {
      words: new Set("Cerebro Corazón Pulmón Diente Hueso Ojo Oreja Nariz Lengua Boca Curita Estetoscopio Pastilla Jeringa Termómetro".split(" ")),
      clues: [
        "Tiene relación con el cuerpo o con su cuidado.",
        "Puede aparecer en conversaciones sobre salud.",
        "Es algo que suele mencionarse cuando se habla de bienestar o medicina.",
        "Su contexto normalmente tiene que ver con el cuerpo.",
        "Es bastante común escucharlo en situaciones relacionadas con la salud."
      ]
    },
    {
      words: new Set("Planeta Luna Saturno Estrella Cometa".split(" ")),
      clues: [
        "Tiene relación con cosas que están mucho más allá de nuestro entorno inmediato.",
        "Es común encontrarlo en temas de astronomía.",
        "Forma parte de conversaciones sobre el espacio.",
        "Su contexto normalmente está relacionado con el cielo.",
        "Es algo que puede aparecer al hablar de lo que vemos desde la Tierra."
      ]
    },
    {
      words: new Set("Lápiz Pluma Bolígrafo Crayón Pincel Nota Carpeta Calendario Clip Chincheta Tijeras Cuaderno".split(" ")),
      clues: [
        "Suele aparecer en un escritorio, salón o espacio de estudio.",
        "Tiene relación con escribir, organizar o crear.",
        "Es un objeto bastante común en actividades escolares o de oficina.",
        "Puede formar parte de un conjunto de útiles cotidianos.",
        "Normalmente aparece cuando alguien está trabajando, estudiando o haciendo algo manual."
      ]
    }
  ];

  function hashImpostorWord(word) {
    return Array.from(String(word || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function getImpostorHint(card) {
    if (!card) return "Piensa en el contexto y en las asociaciones que tenga la palabra.";
    const group = IMPOSTOR_SOFT_GROUPS.find((entry) => entry.words.has(card.word));
    if (group) {
      return group.clues[hashImpostorWord(card.word) % group.clues.length];
    }
    const fallback = {
      Naturaleza: [
        "Tiene relación con el mundo natural.",
        "Es algo que suele aparecer al hablar de naturaleza.",
        "Su entorno ayuda a reconocerlo."
      ],
      Cosas: [
        "Es un objeto que puede aparecer en situaciones cotidianas.",
        "Su uso depende bastante del contexto.",
        "Probablemente lo hayas visto muchas veces."
      ],
      Humanidad: [
        "Tiene relación con personas, actividades o situaciones de la vida diaria.",
        "Su contexto ayuda bastante a reconocerlo.",
        "Es algo que suele aparecer en situaciones comunes."
      ]
    };
    const clues = fallback[card.category] || fallback.Cosas;
    return clues[hashImpostorWord(card.word) % clues.length];
  }

  function savePlayers() {
    try {
      localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players));
    } catch (error) {}
  }

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(STORAGE_PLAYERS);
      const parsed = raw ? JSON.parse(raw) : [];

      players = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      players = [];
    }
  }

  function saveUsedWords() {
    try {
      sessionStorage.setItem(STORAGE_USED, JSON.stringify(usedWords));
    } catch (error) {}
  }

  function loadUsedWords() {
    try {
      const raw = sessionStorage.getItem(STORAGE_USED);
      const parsed = raw ? JSON.parse(raw) : [];

      usedWords = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      usedWords = [];
    }
  }

  function renderPlayers() {
    const list = $("i-uiPlayerList");

    if (!list) {
      return;
    }

    if (players.length === 0) {
      list.innerHTML = '<div class="muted center full-width">Agrega mínimo 3 jugadores.</div>';
      return;
    }

    list.innerHTML = players
      .map((player, index) => {
        return `
          <div class="player-tag">
            ${window.uiIcon("user")} ${escapeHTML(player)}
            <span class="delete-btn" data-remove="${index}">×</span>
          </div>
        `;
      })
      .join("");
  }

  function addPlayer() {
    const input = $("i-inpName");

    if (!input) {
      alert("No encontré el input de jugadores: i-inpName");
      return;
    }

    const name = input.value.trim().toUpperCase();

    if (!name) {
      return;
    }

    const exists = players.some((player) => {
      return player.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
      input.value = "";
      return;
    }

    players.push(name);
    input.value = "";

    savePlayers();
    renderPlayers();
    safeSound(560, 0.08, "triangle");
  }

  function removePlayer(index) {
    const realIndex = Number(index);

    if (Number.isNaN(realIndex)) {
      return;
    }

    players.splice(realIndex, 1);
    savePlayers();
    renderPlayers();
    safeSound(320, 0.08, "triangle");
  }

  function clearPlayers() {
    if (!confirm("¿Borrar jugadores?")) {
      return;
    }

    players = [];

    try {
      localStorage.removeItem(STORAGE_PLAYERS);
    } catch (error) {}

    renderPlayers();
    safeSound(250, 0.12, "sawtooth");
  }

  function changeScreen(screenId) {
    document.querySelectorAll(".im-screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const target = $(screenId);

    if (target) {
      target.classList.add("active");
    }

    const playing = !["i-scr-lobby", "i-scr-result"].includes(screenId);
    document.body.classList.toggle("playing", playing);

    window.scrollTo(0, 0);
  }

  function pickCard() {
    const allCards = getAllCards();

    if (allCards.length === 0) {
      alert("No encontré la base DB_IMPOSTOR en datos.js o está vacía.");
      return null;
    }

    let available = allCards.filter((card) => {
      return !usedWords.includes(card.word);
    });

    if (available.length === 0) {
      usedWords = [];
      available = allCards;
    }

    const card = available[Math.floor(Math.random() * available.length)];

    usedWords.push(card.word);
    saveUsedWords();

    return card;
  }

  function getMinimumPlayers(impostors) {
    return impostors + 2;
  }

  function createRoles(totalPlayers, totalImpostors) {
    const newRoles = Array(totalPlayers).fill("civil");
    const indexes = shuffle([...Array(totalPlayers).keys()]);

    for (let i = 0; i < totalImpostors; i++) {
      newRoles[indexes[i]] = "impostor";
    }

    return newRoles;
  }

  function startGame() {
    const impostorsSelect = $("i-selImposters");
    const timeSelect = $("i-selTime");
    const hintModeSelect = $("i-selHintMode");

    if (!impostorsSelect) {
      alert("No encontré el selector i-selImposters.");
      return;
    }

    if (!timeSelect) {
      alert("No encontré el selector i-selTime.");
      return;
    }

    if (!hintModeSelect) {
      alert("No encontré el selector i-selHintMode.");
      return;
    }

    const impostors = parseInt(impostorsSelect.value, 10);
    const debateTime = parseInt(timeSelect.value, 10);
    impostorHintsEnabled = hintModeSelect.value !== "no-hints";
    const minimum = getMinimumPlayers(impostors);

    if (players.length < minimum) {
      alert(`Con ${impostors} impostor(es), necesitas mínimo ${minimum} jugadores.`);
      return;
    }

    selectedCard = pickCard();

    if (!selectedCard) {
      return;
    }

    Object.keys(impostorCounts).forEach((name) => {
      if (!players.includes(name)) delete impostorCounts[name];
    });
    players.forEach((name) => {
      if (!Number.isFinite(Number(impostorCounts[name]))) {
        impostorCounts[name] = 0;
      }
    });

    roles = Array(players.length).fill("civil");
    const candidates = players
      .map((name, index) => ({ name, index, count: Number(impostorCounts[name] || 0) }))
      .sort((a, b) => a.count - b.count || Math.random() - 0.5);

    for (let i = 0; i < impostors; i++) {
      const candidate = candidates[i];
      roles[candidate.index] = "impostor";
      impostorCounts[candidate.name] = Number(impostorCounts[candidate.name] || 0) + 1;
    }

    currentIndex = 0;
    const civilIndexes = roles
      .map((role, index) => role === "civil" ? index : -1)
      .filter(index => index >= 0);
    starterIndex = civilIndexes[Math.floor(Math.random() * civilIndexes.length)];
    secondsLeft = debateTime;
    timerRunning = false;

    clearInterval(timerId);

    safeSound(450, 0.12, "square");
    setTimeout(() => safeSound(700, 0.18, "square"), 120);

    showPassScreen();
  }

  function showPassScreen() {
    const passName = $("i-txtPassName");

    if (passName) {
      passName.textContent = players[currentIndex];
    }

    changeScreen("i-scr-pass");
  }

  function revealRole() {
    const playerName = players[currentIndex];
    const role = roles[currentIndex];
    const starts = currentIndex === starterIndex;

    const revealName = $("i-txtRevealPlayer");
    const area = $("i-uiSecretArea");

    if (revealName) {
      revealName.textContent = playerName;
    }

    if (!area) {
      alert("No encontré el contenedor i-uiSecretArea.");
      return;
    }

    if (role === "impostor") {
      area.innerHTML = `
        <div class="pass-art">${window.uiIcon("impostor")}</div>
        <div class="badge badge-pink">Rol secreto</div>
        <h2 class="game-title" style="margin-top:6px;color:var(--danger);">ERES EL IMPOSTOR</h2>
        <p class="muted strong-copy">No conoces la palabra exacta.</p>
        <p class="muted strong-copy">Categoría: <strong>${escapeHTML(selectedCard.category)}</strong></p>
        ${impostorHintsEnabled
          ? `<div class="box panel-soft full-width">
              <div class="label-muted color-warning">Pista para ti</div>
              <p class="muted strong-copy">${escapeHTML(getImpostorHint(selectedCard))}</p>
            </div>`
          : `<div class="box panel-soft full-width">
              <div class="label-muted color-warning">Sin pistas</div>
              <p class="muted strong-copy">No recibirás ninguna pista. Tendrás que descubrir la palabra a partir de lo que digan los demás.</p>
            </div>`}
        <div class="box panel-soft full-width">
          <div class="label-muted">Tu misión</div>
          <p class="muted strong-copy">Escucha las pistas, improvisa y trata de parecer inocente.</p>
        </div>
        ${
          starts
            ? `
              <div class="box panel-soft full-width">
                <div class="label-muted color-warning">${window.uiIcon("warning")} Empiezas tú</div>
                <p class="muted strong-copy">Habla con seguridad y da una pista creíble.</p>
              </div>
            `
            : ""
        }
      `;
    } else {
      area.innerHTML = `
        <div class="pass-art">${window.uiIcon("impostor")}</div>
        <div class="badge badge-cyan">Palabra secreta</div>
        <h2 class="game-title" style="margin-top:6px;">${escapeHTML(selectedCard.word)}</h2>
        <p class="muted strong-copy">Todos los inocentes comparten esta palabra.</p>
        <p class="muted strong-copy">Categoría: <strong>${escapeHTML(selectedCard.category)}</strong></p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Tu misión</div>
          <p class="muted strong-copy">Da una pista corta y descubre quién está fingiendo.</p>
        </div>
        ${
          starts
            ? `
              <div class="box panel-soft full-width">
                <div class="label-muted color-warning">${window.uiIcon("warning")} Empiezas tú</div>
                <p class="muted strong-copy">No reveles demasiado la palabra.</p>
              </div>
            `
            : ""
        }
      `;
    }

    safeSound(800, 0.08, "triangle");
    changeScreen("i-scr-reveal");
  }

  function hideRole() {
    currentIndex++;
    safeSound(280, 0.05, "triangle");

    if (currentIndex < players.length) {
      showPassScreen();
      return;
    }

    startDebate();
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  function updateTimer() {
    const timer = $("i-uiTimer");

    if (!timer) {
      return;
    }

    timer.textContent = formatTime(secondsLeft);

    if (secondsLeft <= 15) {
      timer.classList.add("blinking");
    } else {
      timer.classList.remove("blinking");
    }
  }

  function startDebate() {
    const speaker = $("i-txtSpeaker");
    const pauseBtn = $("i-btnPause");

    if (speaker) {
      speaker.textContent = players[starterIndex];
    }

    if (pauseBtn) {
      pauseBtn.innerHTML = `${window.uiIcon("pause")}<span>Pausar</span>`;
    }

    updateTimer();
    changeScreen("i-scr-game");
    timerEndsAt = Date.now() + (Math.max(0, secondsLeft) * 1000);
    startTimer();
  }

  function startTimer() {
    clearInterval(timerId);

    if (!timerEndsAt) {
      timerEndsAt = Date.now() + (Math.max(0, secondsLeft) * 1000);
    }

    timerRunning = true;

    timerId = setInterval(() => {
      const remaining = Math.max(0, timerEndsAt - Date.now());
      secondsLeft = Math.ceil(remaining / 1000);
      updateTimer();

      if (secondsLeft > 0 && secondsLeft <= 10) {
        safeSound(1000, 0.03, "sine");
      }

      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerRunning = false;
        timerEndsAt = 0;
        secondsLeft = 0;

        const timer = $("i-uiTimer");

        if (timer) {
          timer.textContent = "¡TIEMPO!";
          timer.classList.remove("blinking");
        }

        safeSound(220, 0.25, "sawtooth");

        setTimeout(() => {
          showVoteScreen();
        }, 700);
      } else {
        saveSession("i-scr-game");
      }
    }, 250);
  }

  function toggleTimer() {
    const btn = $("i-btnPause");

    if (timerRunning) {
      secondsLeft = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      clearInterval(timerId);
      timerId = null;
      timerRunning = false;
      timerEndsAt = 0;
      updateTimer();

      if (btn) {
        btn.innerHTML = `${window.uiIcon("play")}<span>Reanudar</span>`;
      }

      saveSession("i-scr-game");
      safeSound(380, 0.08, "triangle");
      return;
    }

    if (secondsLeft <= 0) {
      return;
    }

    if (btn) {
      btn.innerHTML = `${window.uiIcon("pause")}<span>Pausar</span>`;
    }

    safeSound(620, 0.08, "triangle");
    timerEndsAt = Date.now() + (Math.max(0, secondsLeft) * 1000);
    startTimer();
  }

  function showVoteScreen() {
    clearInterval(timerId);
    timerRunning = false;

    const list = $("i-uiVoteList");

    if (!list) {
      alert("No encontré el contenedor i-uiVoteList.");
      return;
    }

    list.innerHTML = players
      .map((player, index) => {
        return `
          <button class="vote-btn" type="button" data-vote="${index}">
            ${window.uiIcon("user")} ${escapeHTML(player)}
          </button>
        `;
      })
      .join("");

    safeSound(340, 0.14, "triangle");
    changeScreen("i-scr-vote");
  }

  function finishGame(index) {
    lastVoteIndex = index;
    const votedPlayer = players[index];
    const votedRole = roles[index];

    const impostors = players.filter((player, playerIndex) => {
      return roles[playerIndex] === "impostor";
    });

    const title = $("i-txtResultTitle");
    const area = $("i-uiResultArea");

    if (!title || !area) {
      alert("No encontré el área de resultado.");
      return;
    }

    if (votedRole === "impostor") {
      title.textContent = "¡ATRAPARON AL IMPOSTOR! ";
      title.style.color = "var(--success)";

      area.innerHTML = `
        <div class="pass-art">${window.uiIcon("impostor")}</div>
        <h2 class="big-player-name" style="font-size:1.9rem;">${escapeHTML(votedPlayer)}</h2>
        <p class="muted strong-copy">Sí era impostor.</p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Palabra real</div>
          <div class="big-player-name" style="font-size:1.8rem;">
            ${escapeHTML(selectedCard.word)}
          </div>
          <p class="muted">Categoría: ${escapeHTML(selectedCard.category)}</p>
        </div>
        <div class="box panel-soft full-width">
          <div class="label-muted">Impostor(es)</div>
          <p class="muted strong-copy">${impostors.map(escapeHTML).join(" · ")}</p>
        </div>
      `;

      safeSound(520, 0.08, "square");
      setTimeout(() => safeSound(760, 0.12, "square"), 120);
    } else {
      title.textContent = "¡GANÓ EL IMPOSTOR!";
      title.style.color = "var(--danger)";

      area.innerHTML = `
        <div class="pass-art">${window.uiIcon("impostor")}</div>
        <h2 class="big-player-name" style="font-size:1.9rem;">${escapeHTML(votedPlayer)}</h2>
        <p class="muted strong-copy">Era inocente.</p>
        <div class="box panel-soft full-width">
          <div class="label-muted">Impostor(es)</div>
          <p class="muted strong-copy">${impostors.map(escapeHTML).join(" · ")}</p>
        </div>
        <div class="box panel-soft full-width">
          <div class="label-muted">Palabra real</div>
          <div class="big-player-name" style="font-size:1.8rem;">
            ${escapeHTML(selectedCard.word)}
          </div>
          <p class="muted">Categoría: ${escapeHTML(selectedCard.category)}</p>
        </div>
      `;

      safeSound(300, 0.25, "sawtooth");
    }

    changeScreen("i-scr-result");
  }

  function restartGame() {
    clearInterval(timerId);

    roles = [];
    selectedCard = null;
    currentIndex = 0;
    timerRunning = false;

    document.body.classList.remove("playing");
    changeScreen("i-scr-lobby");
  }

  function bindEvents() {
    const addBtn = $("i-btnAddPlayer");
    const clearBtn = $("i-btnClearPlayers");
    const startBtn = $("i-btnStartGame");
    const revealBtn = $("i-btnReveal");
    const hideBtn = $("i-btnHide");
    const pauseBtn = $("i-btnPause");
    const voteBtn = $("i-btnVoteNow");
    const restartBtn = $("i-btnRestart");
    const input = $("i-inpName");
    const playerList = $("i-uiPlayerList");
    const voteList = $("i-uiVoteList");

    if (addBtn) {
      addBtn.onclick = addPlayer;
    }

    if (clearBtn) {
      clearBtn.onclick = clearPlayers;
    }

    if (startBtn) {
      startBtn.onclick = startGame;
    }

    if (revealBtn) {
      revealBtn.onclick = revealRole;
    }

    if (hideBtn) {
      hideBtn.onclick = hideRole;
    }

    if (pauseBtn) {
      pauseBtn.onclick = toggleTimer;
    }

    if (voteBtn) {
      voteBtn.onclick = showVoteScreen;
    }

    if (restartBtn) {
      restartBtn.onclick = restartGame;
    }

    if (input) {
      input.onkeydown = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addPlayer();
        }
      };
    }

    if (playerList) {
      playerList.onclick = (event) => {
        const btn = event.target.closest("[data-remove]");

        if (!btn) {
          return;
        }

        const index = parseInt(btn.getAttribute("data-remove"), 10);
        removePlayer(index);
      };
    }

    if (voteList) {
      voteList.onclick = (event) => {
        const btn = event.target.closest("[data-vote]");

        if (!btn) {
          return;
        }

        const index = parseInt(btn.getAttribute("data-vote"), 10);
        finishGame(index);
      };
    }
  }

  function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    loadPlayers();
    loadUsedWords();
    renderPlayers();
    bindEvents();

    window.GameSession?.register(saveSession);
    const saved = window.GameSession?.load("impostor");
    if (saved && saved.screen !== "i-scr-lobby" && Array.isArray(saved.players) && saved.selectedCard) {
      players = saved.players;
      usedWords = Array.isArray(saved.usedWords) ? saved.usedWords : usedWords;
      roles = Array.isArray(saved.roles) ? saved.roles : [];
      impostorCounts = saved.impostorCounts && typeof saved.impostorCounts === "object" ? saved.impostorCounts : {};
      impostorHintsEnabled = saved.impostorHintsEnabled !== false;
      selectedCard = saved.selectedCard;
      currentIndex = Number(saved.currentIndex || 0);
      starterIndex = Number(saved.starterIndex || 0);
      secondsLeft = Number(saved.secondsLeft || 0);
      timerRunning = Boolean(saved.timerRunning);
      timerEndsAt = Number(saved.timerEndsAt || 0);
      lastVoteIndex = Number.isInteger(saved.lastVoteIndex) ? saved.lastVoteIndex : null;
      renderPlayers();

      const elapsed = Math.max(0, Math.floor((Date.now() - Number(saved.savedAt || Date.now())) / 1000));
      if (saved.screen === "i-scr-pass") {
        showPassScreen();
      } else if (saved.screen === "i-scr-reveal") {
        revealRole();
      } else if (saved.screen === "i-scr-vote") {
        showVoteScreen();
      } else if (saved.screen === "i-scr-result" && lastVoteIndex !== null) {
        finishGame(lastVoteIndex);
      } else if (saved.screen === "i-scr-game") {
        if (saved.timerRunning) {
          if (timerEndsAt > 0) {
            secondsLeft = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
          } else {
            secondsLeft = Math.max(0, secondsLeft - elapsed);
            timerEndsAt = Date.now() + (secondsLeft * 1000);
          }
        }
        $("i-txtSpeaker").textContent = players[starterIndex] || "";
        changeScreen("i-scr-game");
        updateTimer();
        if (saved.timerRunning && secondsLeft > 0) {
          startTimer();
        } else if (saved.timerRunning && secondsLeft <= 0) {
          showVoteScreen();
        } else {
          clearInterval(timerId);
          timerRunning = false;
          timerEndsAt = 0;
          updateTimer();
        }
      } else {
        changeScreen(saved.screen);
      }
    } else {
      changeScreen("i-scr-lobby");
    }

  }

  return {
    init: init,
    addPlayer: addPlayer,
    removePlayer: removePlayer,
    clearPlayers: clearPlayers,
    startGame: startGame,
    revealRole: revealRole,
    hideRole: hideRole,
    toggleTimer: toggleTimer,
    showVoteScreen: showVoteScreen,
    finishGame: finishGame,
    restartGame: restartGame
  };
})();

window.ImpostorGame = ImpostorGame;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ImpostorGame.init();
  });
} else {
  ImpostorGame.init();
}
