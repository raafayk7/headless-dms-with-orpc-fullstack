import { DateTime, Either, Schema as S } from "effect"

const effectSchema = S.asSchema(
  S.Union(S.DateTimeUtcFromDate, S.DateTimeUtcFromNumber, S.DateTimeUtc).pipe(
    S.transform(S.DateTimeUtcFromDate, {
      decode: (dtUtc) => {
        return new Date(dtUtc.epochMillis)
      },
      encode: (_, dtUtc) => dtUtc,
    }),
  ),
) as S.Schema<DateTime.Utc, Date, never>

const res = S.decodeUnknownEither(effectSchema, {
  errors: "all",
  exact: true,
})(Date.now())

Either.match(res, {
  onRight: (right) => {
    console.debug("Decoded successfully", right)
  },
  onLeft: (err) => {
    console.debug("Decoding failed")
    console.debug(err.issue)
  },
})

const res2 = S.encodeEither(effectSchema, { errors: "all", exact: true })(
  DateTime.unsafeNow(),
  // new Date(),
)

Either.match(res2, {
  onRight: (right) => {
    console.debug("Encoded successfully", right)
  },
  onLeft: (err) => {
    console.debug("Encoding failed")
    console.debug(err.issue)
  },
})
