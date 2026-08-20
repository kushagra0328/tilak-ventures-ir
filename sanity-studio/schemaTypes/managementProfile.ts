import {defineField, defineType} from 'sanity'

export const managementProfile = defineType({
  name: 'managementProfile',
  title: 'Management / Leadership Profile',
  type: 'document',
  fields: [
    defineField({name:'name',title:'Name',type:'string',validation:Rule=>Rule.required()}),
    defineField({name:'role',title:'Role / Designation',type:'string',validation:Rule=>Rule.required()}),
    defineField({name:'bio',title:'Profile / Biography',type:'text',rows:8}),
    defineField({name:'photo',title:'Photo',type:'image'}),
    defineField({name:'displayOrder',title:'Display Order',type:'number',initialValue:100}),
    defineField({name:'active',title:'Show on Website',type:'boolean',initialValue:true}),
  ],
  preview:{select:{title:'name',subtitle:'role'}}
})
