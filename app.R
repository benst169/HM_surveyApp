#Hau Moana | Offshore Wind
## Shiny R app for custom data collection during offshore wind surveys

# Load R packages
library(shiny)
library(shinyMobile)


# Define UI
ui <- f7Page(
  title = "Hau Moana | Aerial Survey Data Collection",
  options = list(
    theme = "md",
    darkmode = FALSE
  ),
  allowPWA = FALSE,   # shinylive registers its own essential service worker;
                      # a second one from shinyMobile would conflict with it
  tags$head(
    tags$link(rel = "manifest", href = "manifest.webmanifest"),
    tags$meta(name = "theme-color", content = "#2196f3"),
    tags$link(rel = "icon", href = "icons/favicon.png"),
    tags$script(src = "indexeddb-storage.js")
  ),
  
  f7TabLayout(
    navbar = f7Navbar(
      title = "Hau Moana | Aerial Survey Data Collection",
      hairline = TRUE
    ),
    
    f7Tabs(
      id = "main_tabs",
     
      f7Tab(title = "Home",
            tabName = "home",
            icon = f7Icon("house"),
            
            # Controls at the top
            div(
              h4("Home"),
              
              f7Grid(
                cols = 3,
                f7Text(
                  inputId = "Survey",
                  label = "Set survey ID",
                  value = ""),
                
                f7Select( 
                  inputId = "Strata",
                  label = "Set strata ID",
                  choices = c(1:5,""),
                  selected = ""),

                f7Select(
                    inputId = "Transect",
                    label = "Set transect ID",
                    choices = c(1:14,""),
                    selected = "")
              ),
              
              f7Grid(
                cols = 2,
                style = "margin-bottom: 20px;",
                
                f7Button(
                  inputId = "on",
                  label = "Effort on",
                  fill = TRUE,
                  color = "green",
                  tonal = TRUE),
                
                f7Button(
                  inputId = "off",
                  label = "Effort off",
                  fill = TRUE,
                  color = "red",
                  tonal = TRUE)
              ),
              
              f7Grid(
                cols = 2,
                
                f7Button(
                  inputId = "start.cb",
                  label = "Initiate circle-back",
                  fill = TRUE,
                  color = "lightsteelblue",
                  tonal = TRUE),
                f7Button(
                  inputId = "stop.cb",
                  label = "End circle-back",
                  fill = TRUE,
                  color = "lightsteelblue",
                  tonal = TRUE)
              ),
              
              f7Text(
                inputId = "any.notes",
                label = "Notes",
                value = ""
              ),
              
              f7Grid(
                cols = 2,
                
                f7Button( 
                  inputId = "save_data",
                  label = "Save",
                  fill = TRUE,
                  color = "lightsteelblue",
                  tonal = TRUE,
                  size = "large"),
                
                f7Button(
                  inputId = "export_csv",
                  label = "Export CSV",
                  fill = TRUE,
                  color = "orange",
                  tonal = TRUE,
                  size = "large")
              )
            ),
            
            hr(),
            
            #Dataframe underneath
            h4("Current Data"),
            
            div(
            style = "overflow-x: auto; width: 100%;",
            tableOutput("data_table")
            ),
            
            tags$style(HTML("
  #data_table {
    font-size: 10px;
  }

  #data_table table {
    width: max-content;
    min-width: 100%;
  }

  #data_table th,
  #data_table td {
    padding: 4px 6px;
    white-space: nowrap;
  }
"))
                
      ),
      f7Tab(title = "Observers",
            tabName = "observers",
            icon = f7Icon("person_2"),
            
            p(
              f7Grid(
                cols = 2,
                
                f7Select(
                  inputId = "Obs.1",
                  label = "Observer 1",
                  choices = c("Laura Rudd","Jochen Zaeschmar","Catherine Meyer","Trudi Webster", "Eva Leunissen", "Nico Winterle Daudt", "Tom Brough", "Will Rayment","Steph Bennington",""),
                  selected = ""),
                
                f7Select(
                  inputId = "Pos.1",
                  label = "Position 1",
                  choices = c("front-left","front-right","back-left","back-right",""),
                  selected = "")
                ),
              
              f7Grid(
                cols = 2,
                
                f7Select(
                  inputId = "Obs.2",
                  label = "Observer 2",
                  choices = c("Laura Rudd","Jochen Zaeschmar","Catherine Meyer","Trudi Webster", "Eva Leunissen", "Nico Winterle Daudt", "Tom Brough", "Will Rayment","Steph Bennington",""),
                  selected = ""),
                
                f7Select(
                  inputId = "Pos.2",
                  label = "Position 2",
                  choices = c("front-left","front-right","back-left","back-right",""),
                  selected = "")
              ),
              
              f7Grid(
                cols = 2,
                
                f7Select(
                  inputId = "Obs.3",
                  label = "Observer 3",
                  choices = c("Laura Rudd","Jochen Zaeschmar","Catherine Meyer","Trudi Webster", "Eva Leunissen", "Nico Winterle Daudt", "Tom Brough", "Will Rayment","Steph Bennington",""),
                  selected = ""),
                
                f7Select(
                  inputId = "Pos.3",
                  label = "Position 3",
                  choices = c("front-left","front-right","back-left","back-right",""),
                  selected = "")
              ),
              
              f7Grid(
                cols = 2,
                
                f7Select(
                  inputId = "Obs.4",
                  label = "Observer 4",
                  choices = c("Laura Rudd","Jochen Zaeschmar","Catherine Meyer","Trudi Webster", "Eva Leunissen", "Nico Winterle Daudt", "Tom Brough", "Will Rayment","Steph Bennington",""),
                  selected = ""),
                
                f7Select(
                  inputId = "Pos.4",
                  label = "Position 4",
                  choices = c("front-left","front-right","back-left","back-right",""),
                  selected = "")
              ),
              
              f7Text(
                inputId = "Obs.notes",
                label = "Additional notes",
                value = ""
                )
              )
            ),
      f7Tab(title = "Environmental Data",
            tabName = "environment",
            icon = f7Icon("wind"),
            p(f7Select(
              inputId = "BF",
              label = "Beaufort sea state",
              choices = c(1:6,""),
              selected = ""),
              f7Select(
                inputId = "Glr.int",
                label = "Glare intensity",
                choices = c("0 - None","1 - Light","2 - Moderate","3 - Severe",""),
                selected = ""),
              f7Select(
                inputId = "Glr.dir",
                label = "Glare direction",
                choices = c("North","Northeast","East","Southeast", "South", "Southwest", "West", "Northwest",""),
                selected = ""),
              f7Select(
                inputId = "Turbidity",
                label = "Turbidity (ocean colour)",
                choices = c("Grey","Dark grey","Dark blue","Blue", "Light blue", "Torquoise", "Light torquiose", "Green","Dark green","Brown","Milky","Red",""),
                selected = ""),
              f7Select(
                inputId = "Swell",
                label = "Swell (m)",
                choices = c(seq(0,6,0.5),""),
                selected = ""),
              f7Select(
                inputId = "CC",
                label = "Cloud cover (eighths)",
                choices = c("1/8","2/8","3/8","4/8","5/8","6/8","7/8","8/8",""),
                selected = ""),
              f7Text(
                inputId = "E.notes",
                label = "Additional notes",
                value = "")
              )
      ),
      
      f7Tab(
        title = "GPS",
        tabName = "gps",
        icon = f7Icon("location_circle"),
        
        p(
          f7Grid(
            cols = 2, 
            
            f7Button(
              inputId = "gps_start",
              label = "GPS start",
              tonal = TRUE,
              fill = TRUE,
              color = "green"
            ),
            
            f7Button(
              inputId = "gps_stop",
              label = "GPS stop",
              tonal = TRUE,
              fill = TRUE,
              color = "red"
            )
          ),
          
          f7Block(
            f7Grid(
              cols = 2,
              f7Block(
                "Longitude: ",
                "Latitude: ",
                "Altitude: ",
                "Speed: "
              ),
              f7Block(
                uiOutput("Longitude"),
                "No positional data",
                uiOutput("Latitude"),
                "No positional data"
                
              )
            )
          )
        )
      )
    )
  )
)


# Define server function
server <- function(input, output, session) {
  
  # Column structure for the live table / exported CSV. Kept as one
  # definition so the table, build_row(), and the restore logic can't drift.
  empty_data <- data.frame(
    DateTime = character(), SurveyID = character(), StrataID = character(),
    Transect = character(), Obs.1 = character(), Pos.1 = character(),
    Obs.2 = character(), Pos.2 = character(), Obs.3 = character(),
    Pos.3 = character(), Obs.4 = character(), Pos.4 = character(),
    Obs.notes = character(), BF = character(), Glr.int = character(),
    Glr.dir = character(), Turb = character(), Swell = character(),
    Cloud = character(), Effort = character(), Notes1 = character(),
    Notes2 = character()
  )
  data_store <- reactiveVal(empty_data)

  # Build one row from the current input values. `effort` and `notes1` let
  # each button stamp its own meaning without repeating every other field.
  build_row <- function(effort = "", notes1 = input$any.notes) {
    data.frame(
      DateTime = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
      SurveyID = input$Survey,
      StrataID = input$Strata,
      Transect = input$Transect,
      Obs.1 = input$Obs.1, Pos.1 = input$Pos.1,
      Obs.2 = input$Obs.2, Pos.2 = input$Pos.2,
      Obs.3 = input$Obs.3, Pos.3 = input$Pos.3,
      Obs.4 = input$Obs.4, Pos.4 = input$Pos.4,
      Obs.notes = input$Obs.notes,
      BF = input$BF, Glr.int = input$Glr.int, Glr.dir = input$Glr.dir,
      Turb = input$Turbidity, Swell = input$Swell, Cloud = input$CC,
      Effort = effort,
      Notes1 = notes1,
      Notes2 = input$E.notes
    )
  }

  # Single path for "an event happened": update the live table AND persist
  # it to the browser's IndexedDB immediately via JS (see
  # www/indexeddb-storage.js). No server-side disk exists in this
  # shinylive/webR build, so this is the actual durability layer.
  record_event <- function(new_row) {
    data_store(rbind(new_row, data_store()))
    session$sendCustomMessage("hm_save_record", as.list(new_row))

    updateTextInput(session, "Obs.notes", value = "")
    updateTextInput(session, "any.notes", value = "")
    updateTextInput(session, "E.notes", value = "")
  }

  observeEvent(input$save_data, {
    record_event(build_row(effort = ""))
  })

  observeEvent(input$on, {
    record_event(build_row(effort = "on"))
  })

  observeEvent(input$off, {
    record_event(build_row(effort = "off"))
  })

  observeEvent(input$start.cb, {
    record_event(build_row(effort = "off", notes1 = "Circle-back protocol initiated"))
  })

  observeEvent(input$stop.cb, {
    record_event(build_row(
      effort = "off",
      notes1 = "Circle-back protocol ended - return to transect"
    ))
  })

  # Rebuild the on-screen table from whatever's already in IndexedDB the
  # moment the page loads - so a reload mid-survey doesn't look like data
  # vanished (it's still there, just not shown yet until this runs).
  observeEvent(input$restored_records_json, {
    # Parse explicitly with simplifyDataFrame = FALSE so the structure is
    # guaranteed to be a list of named lists no matter how many records
    # there are - Shiny's default input-value parsing was auto-simplifying
    # this into a data.frame instead, which silently crashed this observer.
    recs <- tryCatch(
      jsonlite::fromJSON(input$restored_records_json, simplifyDataFrame = FALSE),
      error = function(e) NULL
    )
    if (is.null(recs) || length(recs) == 0) return()

    cols <- names(empty_data)
    rows <- lapply(recs, function(r) {
      vals <- lapply(cols, function(cn) {
        v <- r[[cn]]
        if (is.null(v)) "" else as.character(v)
      })
      setNames(as.data.frame(vals, stringsAsFactors = FALSE), cols)
    })
    data_store(do.call(rbind, rows))
  }, once = TRUE)

  # Export everything currently in IndexedDB as a downloadable CSV - the
  # deliberate manual step for getting data out once you're back online.
  observeEvent(input$export_csv, {
    filename <- paste0(
      "hau_moana_", format(Sys.Date(), "%Y%m%d"), "_",
      format(Sys.time(), "%H%M%S"), ".csv"
    )
    session$sendCustomMessage("hm_export_csv", list(filename = filename))
  })

  # Render table
  output$data_table <- renderTable({ data_store() })

}


# Create shiny object
shinyApp(ui = ui, server = server)
