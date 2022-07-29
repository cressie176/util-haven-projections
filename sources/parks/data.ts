import { entity, value, omit } from "../../src/dsl";

export default {
  data: [
    [
      entity({
        name: [value("Devon Cliffs", "2021-01-01"), value("Devon Hills")],
        code: [value("DC")],
        covidRestrictions: [omit("2021-06-01"), value(true)],
        address: [
          entity({
            addressLine1: [value("Devon Cliffs Holiday Park")],
            addressLine2: [value("Sandy Bay")],
            town: [value("Exmouth")],
            county: [value("Devon")],
            postcode: [value("EX8 5BT")],
          }),
        ],
        telephone: [value("01395226226")],
        coordinates: [
          entity({
            latitude: [value(50.615)],
            longitude: [value(3.3666)],
          }),
        ],
        dogFriendly: [value(true)],
        season: [
          [
            entity({
              guests: [
                entity({
                  start: [value("2022-03-11")],
                  end: [value("2022-11-07")],
                }),
              ],
              touring: [
                omit("24-12-01"),
                entity({
                  start: [value("2022-03-11")],
                  end: [value("2022-11-07")],
                }),
              ],
              owners: [
                entity({
                  start: [value("2022-03-11")],
                  end: [value("2022-11-07")],
                }),
              ],
            }),
            entity(
              {
                guests: [
                  entity({
                    start: [value("2023-03-11")],
                    end: [value("2023-11-07")],
                  }),
                ],
                touring: [
                  entity({
                    start: [value("2023-03-11")],
                    end: [value("2023-11-07")],
                  }),
                ],
                owners: [
                  entity({
                    start: [value("2023-03-11")],
                    end: [value("2023-11-07")],
                  }),
                ],
              },
              "2022-12-01"
            ),
          ],
        ],
      }),
    ],
  ],
};
