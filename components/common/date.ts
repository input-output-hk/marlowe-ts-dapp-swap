import { pipe } from "fp-ts/lib/function";
import getUnixTime from 'date-fns/getUnixTime'
import { Timeout } from "marlowe-ts-sdk/src/language/core/v1/semantics/contract/when";

export const timeoutToDate = (timeout:Timeout):Date => pipe(timeout,Number,(a) => new Date(a))