/**
 * Query for Anilist GraphQL API
 */
export default `
    query ($page: Int, $perPage: Int, $search: String) {
        Page(page: $page, perPage: $perPage) {
            pageInfo {
                total
                perPage
            }
            media(search: $search, type: ANIME, format: TV, sort: FAVOURITES_DESC) {
                id
                coverImage {
                    extraLarge
                }
                title {
                    romaji
                    english
                }
                synonyms
            }
        }
    }  
`