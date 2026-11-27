# Atribuciones

## Pictogramas ARASAAC

Todo lo que se nombra en el juego —objetivos, cartas de parejas, avatares,
colección de pegatinas y refuerzos que son un objeto— son pictogramas de
[ARASAAC](https://arasaac.org) (Centro Aragonés para la Comunicación Aumentativa
y Alternativa), elegidos uno a uno mirándolos al tamaño real del juego
([ADR 0003](docs/adr/0003-arte-arasaac-primero.md)).

- Autor: **Sergio Palao**, Gobierno de Aragón.
- Licencia: **Creative Commons BY-NC-SA 4.0** — atribución, uso no comercial y compartir igual.
- Ficheros en `assets/arasaac/<id>.png`: se descargan de
  `https://static.arasaac.org/pictograms/<id>/<id>_500.png`, **no se modifican**
  (solo se escalan al dibujarse) y se nombran por su id, no por su concepto.
- La tabla de abajo la genera `npm run arasaac:licencia` desde `js/arasaac.js`:
  si se añade un pictograma y no se regenera, el repo lo avisa.

<!-- arasaac:inicio -->
| Conceptos | ID ARASAAC | Palabra clave | Trazo (esquema) |
|---|---|---|---|
| regalo | 25381 | regalo | sí |
| gato | 7114 | gato | sí |
| balon | 2269 | balón | no |
| carita | 13354 | reír | sí |
| estrella, destello | 3100 | Estrella de Navidad | no |
| canica | 36507 | canica | no |
| reno | 9069 | reno | no |
| copo | 38027 | copo de nieve | no |
| campana | 5938 | campana | no |
| galleta | 8312 | galleta | no |
| calcetin | 8339 | calcetín | no |
| perro | 7202 | perro | no |
| pato | 2563 | pato | no |
| vaca | 2609 | vaca | no |
| huevo | 2427 | huevo | no |
| hueso | 6528 | hueso | sí |
| pez | 2520 | pez | no |
| huella | 9071 | huella | sí |
| botas | 2287 | botas | no |
| trofeo | 3162 | trofeo | no |
| bandera | 5918 | bandera | no |
| silbato | 6182 | silbato | no |
| guante | 8595 | guante de béisbol | no |
| camiseta | 2309 | camiseta | no |
| cono | 4928 | cono de señalización | no |
| bicho | 3379 | pulpo | sí |
| chispa | 2752 | estrella | no |
| corazon | 2715 | corazón | no |
| nube | 2883 | nube | no |
| rayo | 34545 | rayo | no |
| contento | 3245 | contento | no |
| contenta | 28647 | contenta | no |
<!-- arasaac:fin -->

El resto del arte —iconos de mecánica, punteros, controles del menú, el icono
«lugar», gestos (destello, chispa, copo) y fondos— es vectorial propio y vive en
`js/pictogramas.js` y `js/fondos.js`.

## Librerías vendoreadas

- **Kaplay** 3001.0.19 — MIT. Escena de juego (`vendor/kaplay.js`).
- **GSAP** 3.15.0 — licencia "no charge" de Webflow. Interfaz (`vendor/gsap.min.js`).

## Uso

Proyecto personal, sin ánimo de lucro y sin publicidad. Si en algún momento se
usara comercialmente, los pictogramas ARASAAC tendrían que sustituirse.
