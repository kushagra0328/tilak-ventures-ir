import {defineField, defineType} from 'sanity'

export const siteSection = defineType({
  name: 'siteSection',
  title: 'Website Section',
  type: 'document',
  fields: [
    defineField({name:'page',title:'Website Page',type:'string',options:{list:[
      {title:'Home',value:'Home'},
      {title:'About Us',value:'About Us'},
      {title:'Governance',value:'Governance'},
      {title:'Contact Us',value:'Contact Us'},
    ]},validation:Rule=>Rule.required()}),
    defineField({name:'sectionKey',title:'Section Key',type:'string',description:'Stable identifier such as hero, overview, registered-office, contact-details.',validation:Rule=>Rule.required()}),
    defineField({name:'eyebrow',title:'Eyebrow / Kicker',type:'string'}),
    defineField({name:'heading',title:'Heading',type:'string'}),
    defineField({name:'subheading',title:'Subheading',type:'string'}),
    defineField({name:'body',title:'Body Text',type:'text',rows:7}),
    defineField({name:'linkLabel',title:'Link / Button Label',type:'string'}),
    defineField({name:'linkUrl',title:'Link / Button URL',type:'string'}),
    defineField({name:'image',title:'Image',type:'image'}),
    defineField({name:'document',title:'Optional Document',type:'file'}),
    defineField({name:'displayOrder',title:'Display Order',type:'number',initialValue:100}),
    defineField({name:'active',title:'Show on Website',type:'boolean',initialValue:true}),
  ],
  preview:{select:{page:'page',heading:'heading',sectionKey:'sectionKey'},prepare({page,heading,sectionKey}){return{title:heading||sectionKey||'Website section',subtitle:[page,sectionKey].filter(Boolean).join(' · ')}}}
})
