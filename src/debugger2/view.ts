import type {ViewOutput} from "./model.ts";

export type View<S> = {
    input: (key: string, state: S) => void,
    render: (state: S) => ViewOutput,
}