import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Tilak Ventures CMS',
  projectId: 'mp4oev3u',
  dataset: 'production',
  plugins: [structureTool({structure})],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'investorDisclosure-by-category',
        title: 'Investor Centre Filing',
        schemaType: 'investorDisclosure',
        parameters: [{name: 'category', type: 'string'}],
        value: ({category}: {category: string}) => ({category}),
      },
    ],
  },
})
