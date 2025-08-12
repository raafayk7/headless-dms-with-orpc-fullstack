// https://github.com/microsoft/tsyringe/issues/108#issuecomment-1491872876
import type { ClassProvider, InjectionToken } from "tsyringe"

// biome-ignore lint/suspicious/noExplicitAny: intentional
type AbstractConstructor<T> = abstract new (...args: any[]) => T
// biome-ignore lint/suspicious/noExplicitAny: Intentional
type ConcreteConstructor<T> = new (...args: any[]) => T

export const asImplementation = <T>(
  InterfaceClass: AbstractConstructor<T>,
  ImplementationClass: ConcreteConstructor<T>,
): [InjectionToken<T>, ClassProvider<T>] => {
  return [
    InterfaceClass as ConcreteConstructor<T>,
    {
      useClass: ImplementationClass,
    },
  ]
}
