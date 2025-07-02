# Therapie.de HTML Structure Analysis

## Overview
Therapie.de provides a search interface for psychotherapists in Germany. The search results are displayed in a structured list format.

## URL Structure
- Base URL: `https://www.therapie.de/therapeutensuche/ergebnisse/`
- Query parameter: `?ort={PLZ}` (e.g., `?ort=90403` for Nürnberg)
- Pagination: `&page={number}` (e.g., `&page=2`)

## HTML Structure

### Main Container
```html
<div class="search-results">
  <ul class="search-results-list list-style-none">
    <!-- Individual therapist entries -->
  </ul>
</div>
```

### Individual Therapist Entry
```html
<li class="panel panel-default panel-closed clearfix">
  <a href="/profil/{therapist-id}/">
    <div class="panel-heading clearfix">
      <div class="search-results-thumbnail pull-left">
        <img src="..." alt="..." />
      </div>
      <div class="search-results-details-container">
        <div class="search-results-name">{Name and Title}</div>
        <div class="search-results-address">
          {Qualification} <br>
          {Address}, {Phone}
        </div>
      </div>
      <div class="search-results-info-container pull-right">
        <div class="search-results-info"><i class="icon-info"></i></div>
        <span class="search-results-distance">{Distance}km</span>
        <div class="search-results-merken merken-not-saved" data-microid="{therapist-id}">
          <div class="merken-icon"></div>
        </div>
      </div>
    </div>
  </a>
</li>
```

## Data Extraction Points

### Therapist Information
1. **Name**: `.search-results-name` - Contains full name and title
2. **Qualification**: First line in `.search-results-address` - Contains professional qualification
3. **Address**: Second line in `.search-results-address` - Street, PLZ, City, Phone
4. **Distance**: `.search-results-distance` - Distance in km
5. **Profile URL**: `href` attribute of main `<a>` tag
6. **Therapist ID**: `data-microid` attribute

### Result Metadata
1. **Total Results**: Text content in `.subheader` (e.g., "138 Treffer im Umkreis von 10 km")
2. **PLZ**: Text content in `<h1>` (e.g., "PLZ 90403:")
3. **Pagination**: `.resultnav` contains page links

## Filtering Criteria

### Remove Heilpraktiker
Filter out entries where any of these contain "heilpr" (case-insensitive):
- Therapist name (`.search-results-name`)
- Qualification (first line of `.search-results-address`)
- Any text content in the entry

### Preferred Qualifications (Keep)
- "Psychologische Psychotherapeutin"
- "Psychologischer Psychotherapeut"
- "Kinder- und Jugendlichenpsychotherapeutin"
- "Psychotherapeutin"
- "Psychotherapeut"
- "Dr. med." (Ärztliche Psychotherapie)

## Example Data Structure

```javascript
{
  plz: "90403",
  totalResults: 138,
  radius: 10,
  therapists: [
    {
      id: "friederike.fritsche",
      name: "Dipl. Psychologin Friederike Fritsche",
      qualification: "Praxis für systemische Beratung und Therapie",
      address: "Weinmarkt 10, 90403 Nürnberg",
      phone: "0911/5408986",
      distance: 0.4,
      profileUrl: "/profil/friederike.fritsche/",
      image: "/fileadmin/_processed_/2/4/csm_friederike.fritsche_3cdc1fb548.jpg"
    }
  ]
}
```

## API Implementation Notes

1. Use Cheerio for HTML parsing in Node.js
2. Handle pagination by extracting page numbers from `.resultnav`
3. Implement caching to avoid excessive requests
4. Filter out Heilpraktiker entries before returning data
5. Normalize phone numbers and addresses
6. Handle missing images (default placeholder)