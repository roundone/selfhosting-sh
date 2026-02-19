# Identity & Directory Services [0/14 complete]
**Priority:** medium-high
**SEO notes:** Annotated by Marketing 2026-02-19. LDAP and directory services are foundational infrastructure for self-hosted environments. OpenLDAP and FreeIPA dominate search volume. "Self-hosted LDAP" and "self-hosted directory service" have consistent volume from sysadmins and homelab users building centralized auth. Strong cross-links with authentication-sso category (Authelia, Authentik integrate with LDAP backends). Replace guides targeting Azure AD and Okta Directory capture enterprise users exploring self-hosted identity stacks.

---

## App Guides

## OpenLDAP Docker Setup Guide
- **Type:** app-guide
- **Target keyword:** openldap docker compose
- **Secondary keywords:** openldap docker setup, self-hosted ldap server, openldap container, openldap self-hosted
- **URL slug:** /apps/openldap
- **Priority:** high
- **Status:** planned

## FreeIPA Docker Setup Guide
- **Type:** app-guide
- **Target keyword:** freeipa docker compose
- **Secondary keywords:** freeipa docker setup, self-hosted identity management, freeipa container, freeipa self-hosted
- **URL slug:** /apps/freeipa
- **Priority:** high
- **Status:** planned

## 389 Directory Server Setup Guide
- **Type:** app-guide
- **Target keyword:** 389 directory server docker
- **Secondary keywords:** 389 directory server setup, 389ds docker compose, red hat directory server self-hosted, 389 ldap server
- **URL slug:** /apps/389-directory-server
- **Priority:** medium
- **Status:** planned

## Kanidm Setup Guide
- **Type:** app-guide
- **Target keyword:** kanidm docker compose
- **Secondary keywords:** kanidm setup, kanidm self-hosted, kanidm identity management, kanidm oauth2
- **URL slug:** /apps/kanidm
- **Priority:** medium
- **Status:** planned

## Lldap Setup Guide
- **Type:** app-guide
- **Target keyword:** lldap docker compose
- **Secondary keywords:** lldap setup, lightweight ldap docker, lldap self-hosted, simple ldap server
- **URL slug:** /apps/lldap
- **Priority:** medium-high
- **Status:** planned

## Samba AD DC Setup Guide
- **Type:** app-guide
- **Target keyword:** samba ad dc docker
- **Secondary keywords:** samba active directory docker compose, samba domain controller setup, self-hosted active directory, samba ad self-hosted
- **URL slug:** /apps/samba-ad-dc
- **Priority:** medium-high
- **Status:** planned

---

## Comparisons

## OpenLDAP vs FreeIPA
- **Type:** compare
- **Target keyword:** openldap vs freeipa
- **Secondary keywords:** openldap or freeipa, freeipa compared to openldap, best self-hosted ldap, ldap server comparison
- **URL slug:** /compare/openldap-vs-freeipa
- **Priority:** high
- **Status:** planned

## FreeIPA vs Samba AD DC
- **Type:** compare
- **Target keyword:** freeipa vs samba ad
- **Secondary keywords:** freeipa or samba active directory, self-hosted domain controller comparison, freeipa vs samba dc
- **URL slug:** /compare/freeipa-vs-samba-ad
- **Priority:** medium-high
- **Status:** planned

## Kanidm vs Lldap
- **Type:** compare
- **Target keyword:** kanidm vs lldap
- **Secondary keywords:** kanidm or lldap, lightweight ldap comparison, modern ldap alternatives, kanidm compared to lldap
- **URL slug:** /compare/kanidm-vs-lldap
- **Priority:** medium
- **Status:** planned

## OpenLDAP vs 389 Directory Server
- **Type:** compare
- **Target keyword:** openldap vs 389 directory server
- **Secondary keywords:** openldap or 389ds, 389 directory server compared to openldap, ldap server comparison linux
- **URL slug:** /compare/openldap-vs-389-directory-server
- **Priority:** medium
- **Status:** planned

---

## Roundup

## Best Self-Hosted LDAP and Directory Services
- **Type:** best
- **Target keyword:** best self-hosted ldap server
- **Secondary keywords:** best self-hosted directory service, self-hosted ldap 2026, open source ldap server comparison, best open source directory service
- **URL slug:** /best/ldap-directory-services
- **Priority:** high
- **Status:** planned

---

## Replace Guides

## Self-Hosted Alternative to Azure AD
- **Type:** replace
- **Target keyword:** self-hosted alternative to azure ad
- **Secondary keywords:** azure active directory alternative, replace azure ad self-hosted, open source azure ad replacement, self-hosted entra id alternative
- **URL slug:** /replace/azure-ad
- **Priority:** high
- **Status:** planned

## Self-Hosted Alternative to Okta Directory
- **Type:** replace
- **Target keyword:** self-hosted alternative to okta directory
- **Secondary keywords:** okta directory alternative, replace okta self-hosted, open source okta replacement, self-hosted user directory
- **URL slug:** /replace/okta-directory
- **Priority:** medium-high
- **Status:** planned

---

## Foundation

## Understanding LDAP for Self-Hosting
- **Type:** foundation
- **Target keyword:** ldap for self-hosting
- **Secondary keywords:** ldap explained, what is ldap self-hosted, ldap tutorial beginners, ldap vs active directory, understanding ldap protocol
- **URL slug:** /foundations/understanding-ldap
- **Priority:** high
- **Status:** planned

---

## Internal Link Strategy

**Pillar page:** /best/ldap-directory-services (roundup links down to all app guides and comparisons)

**Cluster links:**
- All app guides link UP to /best/ldap-directory-services
- All comparisons link to the app guides for both apps compared
- Replace guides link to relevant app guides as recommended alternatives
- Foundation guide links to all app guides and the roundup

**Cross-category links:**
- Link TO /apps/authelia and /apps/authentik (authentication-sso) — LDAP backends integrate with SSO frontends
- Link TO /apps/keycloak (authentication-sso) — Keycloak can use LDAP as a user federation source
- Link TO reverse proxy guides — infrastructure dependency for web-based directory UIs
- Link FROM authentication-sso app guides back to relevant LDAP/directory guides
