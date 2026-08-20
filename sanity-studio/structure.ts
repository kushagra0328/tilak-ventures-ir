import type {StructureResolver} from 'sanity/structure'

const investorSections = [
  'Financial Results','Annual Reports','Board Meetings','Shareholders Meetings','Voting Results','Corporate Actions','Shareholding Pattern','SDD Shareholding Pattern','Corporate Governance','Integrated Filings','Statement of Deviation or Variation','Investor Complaints','Related Party Transactions','BRSR','ASCR','Bulk / Block Deals','Corporate Announcements'
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Tilak Ventures CMS')
    .items([
      S.listItem()
        .title('Investor Centre')
        .child(
          S.list()
            .title('Investor Centre')
            .items(
              investorSections.map((section) =>
                S.listItem()
                  .title(section)
                  .child(
                    S.documentList()
                      .title(section)
                      .filter('_type == "investorDisclosure" && category == $category')
                      .params({category: section})
                      .initialValueTemplates([
                        S.initialValueTemplateItem('investorDisclosure-by-category', {category: section})
                      ])
                  )
              )
            )
        ),
      S.listItem()
        .title('Governance')
        .child(
          S.list()
            .title('Governance')
            .items([
              S.documentTypeListItem('governanceDocument').title('Governance Documents')
            ])
        ),
    ])
