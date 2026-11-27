import * as modulo from "web-push";

/** No servidor o pacote às vezes chega sem `default`; aceita as duas formas. */
const webpush = ((modulo as unknown as { default?: typeof modulo }).default ?? modulo) as typeof modulo;

export default webpush;
