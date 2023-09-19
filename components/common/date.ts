import { pipe } from "fp-ts/lib/function.js";
import { Timeout } from '@marlowe.tmp/language-core-v1/contract/when/index'

export const timeoutToDate = (timeout:Timeout):Date => pipe(timeout,Number,(a) => new Date(a))