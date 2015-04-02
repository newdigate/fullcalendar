function ResourceEventMonthRenderer() {
	var t = this;

    // imports
	BasicEventRenderer.call(t);

    // exports
    t.renderEvents = renderEvents;
    t.dayStart = moment.duration("07:00:00");
    t.dayEnd = moment.duration("18:00:00");
    t.hoursInDay = t.dayEnd.asHours() - t.dayStart.asHours();
    t.getSegmentsForEvent = getSegmentsForEvent;
    t.getCellForDateAndResource = getCellForDateAndResource;
    t.resources = t.calendar.fetchResources(true, t);

    /* Rendering
	----------------------------------------------------------------------------*/
	
	function renderEvents(events, modifiedEventId) {
        events.forEach(function(event, eventIndex) {
            var segments = t.getSegmentsForEvent(event);
            
            segments.forEach(function(segment, segmentIndex) {

                var divForResource = t.getCellForDateAndResource(segment.date, segment.resourceIndex);
                        
                if (divForResource.length > 0) {
                    var resourceBookingDivTable = $('<div></div>');
                    divForResource.append(resourceBookingDivTable);
                    var resourceDivHeight = divForResource.height();
                    var bookingStart = segment.startHour;
                    var bookingEnd = segment.endHour;
                    var divtop = (resourceDivHeight * (bookingStart - t.dayStart.asHours())) / (t.hoursInDay);
                    var divheight = (resourceDivHeight * (bookingEnd - bookingStart)) / (t.hoursInDay);
                    if (divheight === 0) {
                        divheight = 2;
                    }
                    resourceBookingDivTable.attr("title", event.title + ' - ' + bookingStart + ' - ' + bookingEnd);
                    resourceBookingDivTable.css("top", divtop + "px");
                    resourceBookingDivTable.css("height", divheight + "px");
                    resourceBookingDivTable.css("width", Math.floor(100 / t.resources.length) + "%");
                    resourceBookingDivTable.css("background-color", event.color);
                    resourceBookingDivTable.css("position", "absolute");
                    resourceBookingDivTable.css("opacity","0.3");
                }
            });
        });
    }
    
    
    function getCellForDateAndResource(date, resourceIndex) {
        var dataDate = '.fc-day[data-date="' + date.format("YYYY-MM-DD") + '"]';
        var resourceContent = $(dataDate).find('#resourceContent' + date.format("YYYYMMDD") + "R" + resourceIndex);
        return resourceContent;
    }
    
    function getSegmentsForEvent(event) {
        var segments = [];
        
        var mStart = moment(event.start);
        var mEnd = moment(event.end);
        if (!mEnd.isValid()) {
            mEnd = moment(mStart).add(2,'hour');
        }
        if (event.allDay) {
            mEnd = moment(event.start).add(t.dayEnd.asHours(), 'hour');
        }
        var numDays = Math.ceil(moment.duration(mEnd.diff(mStart)).asDays());
        if (numDays === 0) {
            numDays = 1;
        }
        var startDate = moment(mStart).startOf('day');
        
        if(event.resources.length === 0) {
            // resources property on event is not specified, assume event uses all resources!
            t.calendar.options.resources.forEach(function(resource, resourceIndex) {
                
                //console.info("resource:" + resource +"; index:"+resourceIndex);
                if (resourceIndex > -1) {
                    segments = segments.concat(createSegmentsForResource(resource, resourceIndex, numDays, mStart, mEnd, startDate, event.allDay));
                }
                
            });
            
        } else
        if (event.resources instanceof Array) {
        
            event.resources.forEach(function(resource, resourceIndex) {
                segments = segments.concat(createSegmentsForResource(resource, resourceIndex, numDays, mStart, mEnd, startDate, event.allDay));
            });
            
        } else {
            var resourceIndex = getResourceIndexFromId(event.resources, t.calendar.options.resources);
            segments = segments.concat(createSegmentsForResource(event.resources, resourceIndex, numDays, mStart, mEnd, startDate, event.allDay));
        }
        return segments;
    }
    
    function getResourceIndexFromId(resourceId, list) {
        var result = -1;
        list.forEach(function(resource,resourceIndex) {
            if (resourceId == resource.id) {
                result = resourceIndex;
            }
        });
        return result;
    }
    
    // creates a segment per resource per day. 
    function createSegmentsForResource(resource, resourceIndex, numDays, mStart, mEnd, startDate, allDay) {
        var results = [];
        if (allDay) {
            for (var dayIndex=0;dayIndex<numDays;dayIndex++) {
                var allDaySegment = {};
                allDaySegment.date = moment(startDate).add(dayIndex, 'd');
                allDaySegment.resource = resource;
                allDaySegment.resourceIndex = resourceIndex;
                allDaySegment.startHour = t.dayStart.asHours();
                allDaySegment.endHour = t.dayEnd.asHours();
                results.push(allDaySegment);
            }
            
        } else {
        
            for (var i=0;i<numDays;i++) {
                var dateInc = moment(startDate).add(i, 'd');
                var segment = {};
                segment.date = moment(dateInc);
                segment.resource = resource;
                segment.resourceIndex = resourceIndex;
                if (i===0) {
                    // segment for first day of event 
                    if (numDays == 1) {
                        // event does not span multiple days
                        segment.startHour = moment.duration(mStart).asHours();
                        segment.endHour = moment.duration(mEnd).asHours();
                    } else if (numDays > 1){
                       // event spans multiple days
                        var startOfSegmentDay = moment(mStart).startOf('day');
                        segment.startHour = moment.duration(moment(mStart).diff(startOfSegmentDay)).asHours();
                        segment.endHour = t.dayEnd.asHours();
                    }
                } else
                {
                    if (i==numDays-1) {
                        // segment for last day of event
                        segment.startHour = moment.duration(t.dayStart).asHours();
                        segment.endHour = moment.duration(mEnd).asHours();
                    } else
                    {
                        // segment for day between start and end of event
                        segment.startHour = moment.duration(t.dayStart).asHours();
                        segment.endHour = moment.duration(t.dayEnd).asHours();
                    }
                }

                if (segment.startHour < t.dayStart.asHours()) {
                    segment.startHour = t.dayStart.asHours();
                }

                if (segment.endHour > t.dayEnd.asHours()) {
                    segment.endHour = t.dayEnd.asHours();
                }
                
                results.push(segment);
            }
        }
        return results;
    }

}