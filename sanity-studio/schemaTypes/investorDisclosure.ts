import {defineField, defineType} from 'sanity'

const sections = [
  ['Financial Results','Financial Results'],
  ['Annual Reports','Annual Reports'],
  ['Board Meetings','Board Meetings'],
  ['Shareholders Meetings','Shareholders Meetings'],
  ['Voting Results','Voting Results'],
  ['Corporate Actions','Corporate Actions'],
  ['Shareholding Pattern','Shareholding Pattern'],
  ['SDD Shareholding Pattern','SDD Shareholding Pattern'],
  ['Corporate Governance','Corporate Governance'],
  ['Integrated Filings','Integrated Filing'],
  ['Statement of Deviation or Variation','Statement of Deviation or Variation'],
  ['Investor Complaints','Statement of Investor Complaints'],
  ['Related Party Transactions','Related Party Transactions'],
  ['BRSR','BRSR'],
  ['ASCR','ASCR'],
  ['Bulk / Block Deals','Bulk / Block Deals'],
  ['Corporate Announcements','Other Corporate Announcements'],
].map(([value,title])=>({value,title}))

const matrixSections = ['Financial Results','Shareholding Pattern']
const meetingSections = ['Board Meetings','Shareholders Meetings','Voting Results','Corporate Actions']

export const investorDisclosure = defineType({
  name: 'investorDisclosure',
  title: 'Investor Centre Filing',
  type: 'document',
  fields: [
    defineField({
      name: 'category',
      title: 'Investor Centre Section',
      type: 'string',
      options: {list: sections, layout: 'dropdown'},
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'financialYear',
      title: 'Financial Year',
      type: 'string',
      description: 'Example: 2025-26',
      hidden: ({parent}) => !matrixSections.includes(parent?.category),
    }),
    defineField({
      name: 'quarter',
      title: 'Quarter',
      type: 'string',
      options: {list:[
        {title:'Q1 (June)',value:'Q1'},
        {title:'Q2 (September)',value:'Q2'},
        {title:'Q3 (December)',value:'Q3'},
        {title:'Q4 (March)',value:'Q4'},
      ]},
      hidden: ({parent}) => !matrixSections.includes(parent?.category),
    }),
    defineField({
      name: 'period',
      title: 'Quarter Link Label',
      type: 'string',
      description: 'Use the exact website label, e.g. Jun-26, Sep-25, Dec-25 or Mar-26.',
      hidden: ({parent}) => !matrixSections.includes(parent?.category),
      validation: Rule => Rule.custom((v,ctx)=> matrixSections.includes((ctx.parent as any)?.category) && !v ? 'Required for quarterly matrix sections' : true),
    }),
    defineField({
      name: 'date',
      title: 'Date / Meeting Date',
      type: 'date',
      hidden: ({parent}) => matrixSections.includes(parent?.category),
    }),
    defineField({
      name: 'purpose',
      title: 'Type / Purpose',
      type: 'string',
      hidden: ({parent}) => !meetingSections.includes(parent?.category),
    }),
    defineField({
      name: 'title',
      title: 'Particulars / Description',
      type: 'string',
      hidden: ({parent}) => meetingSections.includes(parent?.category) || matrixSections.includes(parent?.category),
    }),
    defineField({
      name: 'pdf',
      title: 'PDF',
      type: 'file',
      options: {accept: '.pdf'},
    }),
    defineField({
      name: 'xbrl',
      title: 'XBRL File',
      type: 'file',
      description: 'Optional. Upload only where the section requires XBRL.',
    }),
    defineField({
      name: 'xbrlUrl',
      title: 'XBRL External Link',
      type: 'url',
      description: 'Optional alternative to uploading an XBRL file.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Optional. Lower numbers appear first where ordering is relevant.',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {category:'category', period:'period', date:'date', purpose:'purpose', title:'title'},
    prepare({category,period,date,purpose,title}) {
      return {
        title: purpose || title || period || 'Investor filing',
        subtitle: [category, period || date].filter(Boolean).join(' · '),
      }
    }
  }
})
