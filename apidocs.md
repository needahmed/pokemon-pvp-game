Skip to content
Navigation Menu
PokeAPI
pokedex-promise-v2

Type / to search
Code
Issues
Pull requests
Actions
Projects
Security
Insights
Owner avatar
pokedex-promise-v2
Public
PokeAPI/pokedex-promise-v2
Go to file
t
Name		
Naramsim
Naramsim
Merge pull request #78 from PokeAPI/dependabot/npm_and_yarn/braces-3.0.3
8bdc668
 · 
4 months ago
.github/workflows
cicd: test on pnpm
last year
dist/src
refactor: cleanup getter code
3 years ago
generator
fix: take care of properties that does not exist
5 months ago
src
refactor: cleanup getter code
3 years ago
test
test: make tests use the new overloads
3 years ago
types
docs: update types to the latest version
5 months ago
.editorconfig
[chore]{wip} Add ESLint to the project
4 years ago
.eslintignore
[chore]{wip} Setup everything for full TypeScript support
4 years ago
.eslintrc.cjs
[chore]{wip} Setup everything for full TypeScript support
4 years ago
.gitignore
[chore]{wip} Setup everything for full TypeScript support
4 years ago
.npmignore
[change]{!!!/wip} Refine directory structure to support better TypeSc…
4 years ago
LICENSE
Initial commit
10 years ago
README.md
Update README.md
6 months ago
bun.lockb
chore: add bun lockdb
5 months ago
package-lock.json
chore: fix vulnerabilities and update packages
5 months ago
package.json
release: bump version
5 months ago
pnpm-lock.yaml
chore(deps-dev): bump braces from 3.0.2 to 3.0.3
5 months ago
tsconfig.json
[chore] Change to ES2020 for compatibility with node 12
4 years ago
Repository files navigation
README
MIT license
pokedex-promise-v2 
npm version Tests Package Quality npm

Maintainers: Naramsim, TheTommyTwitch and HRKings

An easy way to use Pokéapi v2 with promises (or callbacks as of v3) in node.js

Table of Contents

pokedex-promise-v2
Install
Usage
Example requests
Configuration
Endpoints
Berries
Contests
Encounters
Evolution
Games
Items
Machines
Moves
Locations
Pokemon
Utility
Custom URLs and paths
Root Endpoints
List of supported root endpoints
Install nodeVersion
As of 4.0.0 this package is now pure ESM. Please read this.

npm install pokedex-promise-v2 --save
yarn add pokedex-promise-v2
pnpm i pokedex-promise-v2
Usage
import Pokedex from 'pokedex-promise-v2';
const P = new Pokedex();
NOTE: Any function with the designation "ByName" can also be passed an integer ID. However, the functions with the designation "ById" can only be passed an integer ID. Refer to the pokeapi v2 docs to find out more about how the data is structured.

UPDATE: You can pass an array to each endpoint, it will retrive data for each array element. If you scroll down, you will find an example.

Example requests
(async () => { // with Async/Await
    try {
        const golduckSpecies = await P.getPokemonSpeciesByName("golduck")
        const frenchName = golduckSpecies.names.filter(pokeAPIName => pokeAPIName.language.name === 'fr')[0].name
        console.log(frenchName)
    } catch (error) {
        throw error
    }
})()

P.getPokemonByName(['eevee', 'ditto']) // with Promise
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log('There was an ERROR: ', error);
  });

P.getPokemonByName(34, (response, error) => { // with callback
    if(!error) {
      console.log(response);
    } else {
      console.log(error)
    }
  });

P.getResource(['/api/v2/pokemon/36', 'api/v2/berry/8', 'https://pokeapi.co/api/v2/ability/9/'])
  .then((response) => {
    console.log(response); // the getResource function accepts singles or arrays of URLs/paths
  });
Configuration
Pass an Object to Pokedex in order to configure it. Available options: protocol, hostName, versionPath, cacheLimit in ms, timeout in ms. Any option is optional 😄. If no Object is passed, the Pokedex will be initialized to grab data from pokeapi.co using http with 20 seconds timeout and caching resources for 11 days. HTTPS is the default protocol.

import Pokedex from 'pokedex-promise-v2';
const options = {
  protocol: 'https',
  hostName: 'localhost:443',
  versionPath: '/api/v2/',
  cacheLimit: 100 * 1000, // 100s
  timeout: 5 * 1000 // 5s
}
const P = new Pokedex(options);
Endpoints
Berries
Use getBerryByName to return data about a specific berry.

  P.getBerryByName('cheri')
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getBerryFirmnessByName to return data about the firmness of a specific berry.

  P.getBerryFirmnessByName('very-soft')
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getBerryFlavorByName to return data about the flavor of a specific berry.

  P.getBerryFlavorByName('spicy')
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Array as a parameter example. It can be a mixed array. This method fetches data asynchronously. So it is quite fast 😄

  P.getBerryByName(['cheri', 'chesto', 5])
    .then((response) => {
      console.log(response);
    })
  // response will be an Array containing 3 Objects
  // response.forEach((item) => {console.log(item.size)}) // 80,50,20
Contests
Use getContestTypeByName to return data about the effects of moves when used in contests.

  P.getContestTypeByName('cool')
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getContestEffectById to return data about the effects of moves when used in contests.

  P.getContestTypeByName(1)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getSuperContestEffectById to return data about the effects of moves when used in super contests.

  P.getSuperContestTypeById(1)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Encounters
Use getEncounterMethodByName to return data about the conditions in which a trainer may encounter a pokemon in the wild.

  P.getEncounterMethodByName("walk")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getEncounterConditionByName to return data that affects which pokemon might appear in the wild.

  P.getEncounterConditionByName("swarm")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getEncounterConditionValueByName to return data the various states that an encounter condition can have.

  P.getEncounterConditionValueByName("swarm-yes")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Evolution
Use getEvolutionChainById to return data evolution chains.

  P.getEvolutionChainById(1)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getEvolutionTriggerByName to return data about triggers which cause pokemon to evolve.

  P.getEvolutionTriggerByName("level-up")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Games
Use getGenerationByName to return data about the different generations of pokemon games.

  P.getGenerationByName("generation-i")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokedexByName to return data about specific types of pokedexes.

  P.getPokedexByName("kanto")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getVersionByName to return data about specific versions of pokemon games.

  P.getVersionByName("red")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getVersionGroupByName to return data about specific version groups of pokemon games.

  P.getVersionGroupByName("red-blue")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Items
Use getItemByName to return data about specific items.

  P.getItemByName("master-ball")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getItemAttributeByName to return data about specific item attribute.

  P.getItemAttributeByName("countable")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getItemCategoryByName to return data about specific item category.

  P.getItemCategoryByName("stat-boosts")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getItemFlingEffectByName to return data about specific item fling effect.

  P.getItemFlingEffectByName("badly-poison")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getItemPocketByName to return data about specific pockets in a players bag.

  P.getItemPocketByName("misc")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Machines
Use getMachineById to return data about specific machine.

  P.getMachineById(2)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Moves
Use getMoveByName to return data about specific pokemon move.

  P.getMoveByName("pound")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveAilmentByName to return data about specific pokemon move ailment.

  P.getMoveAilmentByName("paralysis")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveBattleStyleByName to return data about specific pokemon move battle style.

  P.getMoveBattleStyleByName("attack")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveCategoryByName to return data about specific pokemon move category.

  P.getMoveCategoryByName("ailment")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveDamageClassByName to return data about specific pokemon damage class.

  P.getMoveDamageClassByName("status")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveLearnMethodByName to return data about specific pokemon learn method.

  P.getMoveLearnMethodByName("level-up")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getMoveTargetByName to return data about specific pokemon move target.

  P.getMoveTargetByName("specific-move")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Locations
Use getLocationByName to return data about specific pokemon location.

  P.getLocationByName("sinnoh")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getLocationAreaByName to return data about specific pokemon location area.

  P.getLocationAreaByName("canalave-city-area")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPalParkAreaByName to return data about specific pokemon pal park area.

  P.getPalParkAreaByName("forest")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getRegionByName to return data about specific pokemon region.

  P.getRegionByName("kanto")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Pokemon
Use getAbilityByName to return data about specific pokemon ability.

  P.getAbilityByName("stench")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getCharacteristicById to return data about specific pokemon characteristic.

  P.getCharacteristicById(1)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getEggGroupByName to return data about specific pokemon egg group.

  P.getEggGroupByName("monster")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getGenderByName to return data about specific pokemon gender.

  P.getGenderByName("female")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getGrowthRateByName to return data about specific pokemon growth rate.

  P.getGrowthRateByName("slow")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getNatureByName to return data about specific pokemon nature.

  P.getNatureByName("bold")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokeathlonStatByName to return data about specific pokeathon stat.

  P.getPokeathlonStatByName("speed")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonByName to return data about specific pokemon.

  P.getPokemonByName("butterfree")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonColorByName to return data about specific pokemon color.

  P.getPokemonColorByName("black")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonFormByName to return data about specific pokemon form.

  P.getPokemonFormByName("wormadam-plant")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonHabitatByName to return data about specific pokemon habitat.

  P.getPokemonHabitatByName("grottes")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonShapeByName to return data about specific pokemon shape.

  P.getPokemonShapeByName("ball")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getPokemonSpeciesByName to return data about specific pokemon species.

  P.getPokemonSpeciesByName("wormadam")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getStatByName to return data about specific pokemon stat.

  P.getStatByName("attack")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Use getTypeByName to return data about specific pokemon type.

  P.getTypeByName("ground")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Utility
Use getLanguageByName to return data about specific pokemon language.

  P.getLanguageByName("ja")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log('There was an ERROR: ', error);
    });
Custom URLs and paths
Use resource to return data about any URL or path.

  P.getResource(['/api/v2/pokemon/36', 'api/v2/berry/8', 'https://pokeapi.co/api/v2/ability/9/'])
    .then((response) => {
      console.log(response); // resource function accepts singles or arrays of URLs/paths
    });

  P.getResource('api/v2/berry/5')
    .then((response) => {
      console.log(response);
    });
Root Endpoints
For each root endpoint we provide a method to get all the items contained by that endpoint. By default the method will return every item in the endpoint. If you want you can configure its offset and limit.

offset is where to start. The first item that you will get. Default 0
limit is how many items you want to list. Default 100000
TIP: Do not pass any config Object to your call, since you will get every item and everything will be cached to your RAM.

This call will get the list of pokemon between ID 34 and ID 44

  const interval = {
    limit: 10,
    offset: 34
  }
  P.getPokemonsList(interval)
    .then((response) => {
      console.log(response);
    })
This is what you will get:

{
  "count": 811,
  "next":  "https://pokeapi.co:443/api/v2/pokemon/?limit=11&offset=44",
  "previous": "https://pokeapi.co:443/api/v2/pokemon/?limit=11&offset=22",
  "results": [
    {
      "url": "https://pokeapi.co:443/api/v2/pokemon/34/",
      "name": "nidoking"
    },
    {
      "url": "https://pokeapi.co:443/api/v2/pokemon/35/",
      "name": "clefairy"
    },
    {
      "url": "...",
      "name": "..."
    },
    {
      "url": "https://pokeapi.co:443/api/v2/pokemon/44/",
      "name": "gloom"
    }
  ]
}
List of supported root endpoints
.getEndpointsList()
.getBerriesList()
.getBerriesFirmnessList()
.getBerriesFlavorsList()
.getContestTypesList()
.getContestEffectsList()
.getSuperContestEffectsList()
.getEncounterMethodsList()
.getEncounterConditionsList()
.getEncounterConditionValuesList()
.getEvolutionChainsList()
.getEvolutionTriggersList()
.getGenerationsList()
.getPokedexList()
.getVersionsList()
.getVersionGroupsList()
.getItemsList()
.getItemAttributesList()
.getItemCategoriesList()
.getItemFlingEffectsList()
.getItemPocketsList()
.getMachinesList()
.getMovesList()
.getMoveAilmentsList()
.getMoveBattleStylesList()
.getMoveCategoriesList()
.getMoveDamageClassesList()
.getMoveLearnMethodsList()
.getMoveTargetByName()
.getLocationsList()
.getLocationAreasList()
.getPalParkAreasList()
.getRegionsList()
.getAbilitiesList()
.getCharacteristicsList()
.getEggGroupsList()
.getGendersList()
.getGrowthRatesList()
.getNaturesList()
.getPokeathlonStatsList()
.getPokemonsList()
.getPokemonColorsList()
.getPokemonFormsList()
.getPokemonHabitatsList()
.getPokemonShapesList()
.getPokemonSpeciesList()
.getStatsList()
.getTypesList()
.getLanguagesList()
Development
A linux environment is preferred. bash, sed, find are required.

npm i
npm run apidata:clone # Only if you are building for the first time
npm run apidata:sync # Only if you have already built once
npm run apidata:replace
npm run generate:types
npm run generate:main
npm run generate:jsdocs
npm t
About
An easy way to use pokeapi v2 with promises in node.js

Topics
nodejs javascript wrapper pokemon pokeapi hacktoberfest
Resources
 Readme
License
 MIT license
 Activity
 Custom properties
Stars
 525 stars
Watchers
 18 watching
Forks
 96 forks
Report repository
Releases 7
4.2.1
Latest
on Dec 28, 2024
+ 6 releases
Packages
No packages published
Contributors
8
@Naramsim
@HRKings
@tasadurian
@C-Garza
@dependabot[bot]
@SomeoneWeird
@brandly
@simonorono
Languages
TypeScript
99.9%
 
JavaScript
0.1%
Footer
© 2025 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Docs
Contact
Manage cookies
Do not share my personal information
Editing pokedex-promise-v2/README.md at master · PokeAPI/pokedex-promise-v2