import { projectIdentifierBySelector, projectRegex } from "./utils"
import remoteServicesCommunity from "./remoteServicesCommunity"
import axios from 'axios'
import stringSimilarity from "string-similarity"

let actualProject

export default {
  /*asana: {
    name: "asana",
    host: "https://app.asana.com",
    urlPatterns: [
      [/^:host:\/0\/\d+\/(\d+)/, ["id"]],
      [/^:host:\/0\/inbox\/\d+\/(\d+)/, ["id"]],
      [/^:host:\/0\/search\/\d+\/(\d+)/, ["id"]],
    ],
    description: (document) =>
      [
        "Task Name",
        "Aufgabenname",
        "Nombre de la tarea",
        "Nom de la tâche",
        "Nome da tarefa",
      ].reduce(
        (description, value) =>
          description ?? document.querySelector(`[aria-label="${value}"]`)?.textContent?.trim(),
        null,
      ),
    projectId: projectIdentifierBySelector(".TopbarPageHeaderStructure-titleRow h1"),
    allowHostOverride: false,
    position: { right: "50%", transform: "translateX(50%)" },
  },*/

  /*clickup: {
    name: "clickup",
    host: "https://app.clickup.com",
    urlPatterns: [":host:/t/:id", ":host:/t/:id/:customId", ":host:/:space/v/l/f/:folder"],
    description: (document, service, { id, customId }) => {
      const title = document.querySelector(".task-name__overlay")?.textContent?.trim()
      return `#${customId || id} ${title || ""}`.trim()
    },
    allowHostOverride: false,
  },*/

  "github-pr": {
    name: "github",
    host: "https://github.com",
    urlPatterns: [":host:/:org/:repo/pull/:id(/:tab)"],
    id: (document, service, { org, repo, id }) => [service.key, org, repo, id].join("."),
    description: (document) => document.querySelector(".js-issue-title")?.textContent?.trim(),
    projectId: projectIdentifierBySelector(".js-issue-title"),
    allowHostOverride: false,
  },

  "github-issue": {
    name: "github",
    host: "https://github.com",
    urlPatterns: [":host:/:org/:repo/issues/:id"],
    id: (document, service, { org, repo, id }) => [service.key, org, repo, id].join("."),
    description: (document, service, { org, repo, id }) =>
      document.querySelector(".js-issue-title")?.textContent?.trim(),
    projectId: projectIdentifierBySelector(".js-issue-title"),
    allowHostOverride: false,
  },

  jira: {
    name: "jira",
    host: "https://:org.atlassian.net",
    urlPatterns: [
      ":host:/secure/RapidBoard.jspa",
      ":host:/browse/:id(#comment-:commentId)",
      ":host:/jira/software/projects/:projectId/boards/:board",
      ":host:/jira/software/projects/:projectId/boards/:board/backlog",
      ":host:/jira/software/projects/:projectId/boards/:board/roadmap",
      ":host:/jira/software/c/projects/:projectId/boards/:board",
      ":host:/jira/software/c/projects/:projectId/boards/:board/backlog",
      ":host:/jira/software/c/projects/:projectId/boards/:board/roadmap",
    ],
    queryParams: {
      id: "selectedIssue",
      projectId: "projectKey",
    },
    description: (document, service, { id }) => {
      const title =
        document
          .querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]')
          ?.textContent?.trim() ||
        document.querySelector(".ghx-selected .ghx-summary")?.textContent?.trim()
      return `#${id} ${title || ""}`
    },
    projectId: (document, service, { projectId }) =>
      projectIdentifierBySelector(
        "[data-test-id='issue.views.issue-base.foundation.summary.heading']",
      )(document) ||
      projectIdentifierBySelector("[data-navheader] [data-item-title]")(document) ||
      projectId,
    allowHostOverride: true,
  },

  meistertask: {
    name: "meistertask",
    host: "https://www.meistertask.com",
    urlPatterns: [":host:/app/task/:id/:slug"],
    description: (document) => {
      const json = document.getElementById("mt-toggl-data")?.dataset?.togglJson || "{}"
      const data = JSON.parse(json)
      return data.taskName
    },
    projectId: (document) => {
      const json = document.getElementById("mt-toggl-data")?.dataset?.togglJson || "{}"
      const data = JSON.parse(json)
      const match = data.taskName?.match(projectRegex) || data.projectName?.match(projectRegex)
      return match && match[1]
    },
    allowHostOverride: false,
  },

  trello: {
    name: "trello",
    host: "https://trello.com",
    urlPatterns: [":host:/c/:id/:title"],
    description: (document, service, { title }) =>
      document.querySelector(".js-title-helper")?.textContent?.trim() || title,
    projectId: (document) =>
      projectIdentifierBySelector(".js-title-helper")(document) ||
      projectIdentifierBySelector(".js-board-editing-target")(document),
    allowHostOverride: false,
  },

  youtrack: {
    name: "youtrack",
    host: "https://:org.youtrack.cloud",
    urlPatterns: [
      ":host:/issue/:id(/*)",
      ":host:/youtrack/issue/:id(/*)",
      ":host:/issues",
      ":host:/search/:filter",
    ],
    queryParams: {
      id: "preview",
    },
    description: (document) =>
      document.querySelector('h1[data-test="ticket-summary"]')?.textContent?.trim(),
    projectId: (document) =>
      projectIdentifierBySelector("article aside div:first-child span")(document) ||
      projectIdentifierBySelector(
        "table[data-test=fields-compact] tr:first-child td:first-child button",
      )(document) ||
      projectIdentifierBySelector("h1[data-test=ticket-summary]")(document),
    allowHostOverride: true,
  },

  wrike: {
    name: "wrike",
    host: "https://:region.wrike.com",
    urlPatterns: [
      ":host:/workspace.htm#folder*",
      ":host:/workspace.htm#todo",
      ":host:/workspace.htm#created-by-me",
      ":host:/workspace.htm#starred-tasks",
    ],
    queryParams: {
      id: ["sidePanelItemId", "overlayEntityId"],
    },
    description: (document) => document.querySelector(".title__ghost")?.textContent?.trim(),
    projectId: projectIdentifierBySelector(".header-title__main"),
    allowHostOverride: false,
    position: { right: "calc(2rem + 5px)", bottom: "180px" },
  },

  wunderlist: {
    name: "wunderlist",
    host: "https://www.wunderlist.com",
    urlPatterns: [":host:/(webapp)#/tasks/:id(/*)"],
    description: (document) =>
      document
        .querySelector(".taskItem.selected .taskItem-titleWrapper-title")
        ?.textContent?.trim(),
    projectId: projectIdentifierBySelector(".taskItem.selected .taskItem-titleWrapper-title"),
    allowHostOverride: false,
  },


  // Custom services

  asana: {
    name: "asana", // Should be freshdesk but there is a whitelist in place at the API endpoint -> We use an existing name here
    host: "https://previonplusag.freshdesk.com",
    urlPatterns: [":host:/a/tickets/:id"],
    description: (document, service, { id }) => {
      const type = document.querySelector("div [data-test-id='tkt-properties-ticket_type'] > div > div > .ember-power-select-trigger > div > span").textContent.trim()
      const title = document.querySelector(".ticket-subject-heading").textContent.trim()
      const maxTime =
        document
          ? document.getElementsByName("customFields.geschtzter_aufwand")[0].value.toString()
          : ''
      const isMaxTime = maxTime ? `Max Time: ${maxTime} | ` : ''
      
      return `#${id}: ${isMaxTime}${type} - ${title}`
    },
    projectId: document => {

      axios.get('https://www.erp-mapping.previon.net/public/api/customers')
        .then(response => {
          const customers = JSON.parse(response)
          const customerName = document.querySelector(".info-details__company").textContent.trim()
          const customerProjects = customers.filter(customer =>
            stringSimilarity.compareTwoStrings(customer.name.toLowerCase(), customerName.toLowerCase()) >= 0.8 
          )
          const hasSubProjects = 'subProjects' in customerProjects[0]
          if (hasSubProjects) {
            const specialSelection = document.querySelector("div [data-test-id='Spezialzuweisung Projekt'] > .ember-basic-dropdown-trigger > div > .ember-power-select-selected-item").textContent.trim()
            const project = customerProjects[0].subProjects.filter(subProject =>
            stringSimilarity.compareTwoStrings(subProject.name.toLowerCase(), specialSelection.toLowerCase()) >= 0.8
            )
            actualProject = project[0]
            
            return project[0].pIdentifier
          } else {
            actualProject = customerProjects[0]
            
            return customerProjects[0].pIdentifier
      }
        }).catch(() => {
          console.log('======>>>')
          console.log('======>>>')
          console.log('Customers JSON not available!')
          console.log('^^^======^^^')
          console.log('^^^======^^^')
          window.alert('Customers JSON not available!')
        })
    },
    taskId: document => {
      const type = document.querySelector("div [data-test-id='tkt-properties-ticket_type'] > div > div > .ember-power-select-trigger > div > span").textContent.trim()
      switch (type) {
        case "Kundenbetreuung":
          return actualProject.customerService
        case "Erweiterung":
          return actualProject.extension
        case "Incident":
          return actualProject.incident
        case "Fehler":
          return actualProject.bug
      }
    },
    allowHostOverride: true,
  },

  clickup: {
    name: "clickup", // Should be previon but there is a whitelist in place at the API endpoint -> We use an existing name here
    host: "https://support.previon.ch",
    urlPatterns: [":host:/a/tickets/:id"],
    description: (document, service, { id }) => {
      const type = document.querySelector("div [data-test-id='tkt-properties-ticket_type'] > div > div > .ember-power-select-trigger > div > span").textContent.trim()
      const title = document.querySelector(".ticket-subject-heading").textContent.trim()
      const maxTime =
        document
          ? document.getElementsByName("customFields.geschtzter_aufwand")[0].value.toString()
          : ''
      const isMaxTime = maxTime ? `Max Time: ${maxTime} | ` : ''
      
      return `#${id}: ${isMaxTime}${type} - ${title}`
    },
    projectId: document => {

      axios.get('https://www.erp-mapping.previon.net/public/api/customers')
        .then(response => {
          const customers = JSON.parse(response)
          const customerName = document.querySelector(".info-details__company").textContent.trim()
          const customerProjects = customers.filter(customer =>
            stringSimilarity.compareTwoStrings(customer.name.toLowerCase(), customerName.toLowerCase()) >= 0.8 
          )
          const hasSubProjects = 'subProjects' in customerProjects[0]
          if (hasSubProjects) {
            const specialSelection = document.querySelector("div [data-test-id='Spezialzuweisung Projekt'] > .ember-basic-dropdown-trigger > div > .ember-power-select-selected-item").textContent.trim()
            const project = customerProjects[0].subProjects.filter(subProject =>
            stringSimilarity.compareTwoStrings(subProject.name.toLowerCase(), specialSelection.toLowerCase()) >= 0.8
            )
            actualProject = project[0]
            
            return project[0].pIdentifier
          } else {
            actualProject = customerProjects[0]
            
            return customerProjects[0].pIdentifier
      }
        }).catch(() => { 
          console.log('======>>>')
          console.log('======>>>')
          console.log('Customers JSON not available!')
          console.log('^^^======^^^')
          console.log('^^^======^^^')
          window.alert('Customers JSON not available!')
        })
    },
    taskId: document => {
      const type = document.querySelector("div [data-test-id='tkt-properties-ticket_type'] > div > div > .ember-power-select-trigger > div > span").textContent.trim()
      switch (type) {
        case "Kundenbetreuung":
          return actualProject.customerService
        case "Erweiterung":
          return actualProject.extension
        case "Incident":
          return actualProject.incident
        case "Fehler":
          return actualProject.bug
      }
    },
    allowHostOverride: true,
  }, 

  ...remoteServicesCommunity,
}
