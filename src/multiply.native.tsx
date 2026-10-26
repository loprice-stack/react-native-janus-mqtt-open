import JanusMqttOpen from './NativeJanusMqttOpen';

export function multiply(a: number, b: number): number {
  return JanusMqttOpen.multiply(a, b);
}
