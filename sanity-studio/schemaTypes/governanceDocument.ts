import {defineField, defineType} from 'sanity'

export const governanceDocument = defineType({
  name: 'governanceDocument',
  title: 'Governance Document',
  type: 'document',
  fields: [
    defineField({name:'title',title:'Document Name',type:'string',validation:Rule=>Rule.required()}),
    defineField({name:'subtitle',title:'Short Description',type:'string',description:'Example: Vigil Mechanism, Direct PDF, Historical programme disclosure'}),
    defineField({name:'financialYear',title:'Financial Year / Period',type:'string',description:'Optional, e.g. 2025-26'}),
    defineField({name:'documentType',title:'Document Type',type:'string',options:{list:[
      {title:'Policy',value:'Policy'},
      {title:'Code',value:'Code'},
      {title:'Familiarisation Programme',value:'Familiarisation Programme'},
      {title:'Committee / Governance Document',value:'Governance Document'},
      {title:'Other',value:'Other'},
    ]}}),
    defineField({name:'pdf',title:'PDF',type:'file',options:{accept:'.pdf'}}),
    defineField({name:'externalUrl',title:'External Link',type:'url',description:'Optional alternative if the document is hosted elsewhere.'}),
    defineField({name:'displayOrder',title:'Display Order',type:'number',initialValue:100}),
    defineField({name:'active',title:'Show on Website',type:'boolean',initialValue:true}),
  ],
  preview:{
    select:{title:'title',subtitle:'subtitle',financialYear:'financialYear'},
    prepare({title,subtitle,financialYear}){return{title,subtitle:[financialYear,subtitle].filter(Boolean).join(' · ')}}
  }
})
