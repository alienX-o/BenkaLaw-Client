import React, {
  useState,
  useMemo,
  useEffect,
  memo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Pressable,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import VectorIcon from '../../assets/vectorIcons/VectorIcons';
import {
  BorderRadius,
  BorderWidth,
  FontSize,
  FontWeight,
  Spacing,
} from '../../constants/theme';
import colors from '../../constants/colors';
import { api } from '../../utils/http.common';
import {
  timeToMinutes,
  toYYYYMMDD,
  formatFullDateTime,
} from '../../utils/common';
import { showErrorCSS } from 'react-native-svg/lib/typescript/deprecated';
import { s } from 'react-native-size-matters';

// --- Configuration Constants ---
const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 70;
const TIMELINE_START_HOUR = 0;
const TIMELINE_END_HOUR = 24;
const TODAY = new Date();

// Helpers
const isSameDay = (date1, date2) => {
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// --- Event Overlap Calculation Helper ---
const calculateEventLayout = events => {
  const eventsWithTimes = events
    .map(event => ({
      ...event,
      startMinutes: timeToMinutes(event.startTime),
      endMinutes: timeToMinutes(event.startTime) + event.durationMinutes,
      column: -1,
      totalColumns: 1,
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (let i = 0; i < eventsWithTimes.length; i++) {
    const currentEvent = eventsWithTimes[i];
    const overlappingEvents = [currentEvent];

    // Find all events that overlap with the current event
    for (let j = i + 1; j < eventsWithTimes.length; j++) {
      const nextEvent = eventsWithTimes[j];
      if (nextEvent.startMinutes < currentEvent.endMinutes) {
        overlappingEvents.push(nextEvent);
      }
    }

    // Determine the number of columns needed for this overlapping group
    let maxConcurrent = 0;
    for (const event of overlappingEvents) {
      let concurrent = 0;
      for (const otherEvent of overlappingEvents) {
        if (
          event.startMinutes < otherEvent.endMinutes &&
          event.endMinutes > otherEvent.startMinutes
        ) {
          concurrent++;
        }
      }
      if (concurrent > maxConcurrent) {
        maxConcurrent = concurrent;
      }
    }

    // Assign columns to each event in the group
    for (const event of overlappingEvents) {
      if (event.column === -1) {
        // Only assign if not already assigned
        event.totalColumns = Math.max(event.totalColumns, maxConcurrent);
        for (let col = 0; col < event.totalColumns; col++) {
          const isColumnFree = !overlappingEvents.some(
            e =>
              e.column === col &&
              event.startMinutes < e.endMinutes &&
              event.endMinutes > e.startMinutes,
          );
          if (isColumnFree) {
            event.column = col;
            break;
          }
        }
      }
    }
  }

  return eventsWithTimes.map(event => {
    const eventWidth = 75 / event.totalColumns;
    const leftOffset = 20 + event.column * eventWidth;
    return { ...event, width: `${eventWidth}%`, left: `${leftOffset}%` };
  });
};

// --- Sub-components for Optimization and Readability ---

const EventCard = memo(({ event, top, height, onPress, width, left }) => {
  const getEventStyle = () => {
    if (event.is_event_cancelled?.toLowerCase() === 'yes') {
      return {
        backgroundColor: '#FFEBEE',
        borderLeftColor: '#D32F2F',
      };
    }
    if (event.is_event_rescheduled?.toLowerCase() === 'yes') {
      return {
        backgroundColor: '#FFF9C4',
        borderLeftColor: '#FBC02D',
      };
    }
    return {
      backgroundColor: '#589BD233',
      borderLeftColor: '#589BD2',
    };
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        {
          top,
          height,
          width,
          left,
        },
        getEventStyle(),
      ]}
      onPress={() => onPress(event)}
      delayLongPress={200}
    >
      <Text style={styles.eventCardTextName}>
        <Text style={styles.eventStatus}>
          {event.is_event_cancelled?.toLowerCase() === 'yes'
            ? 'Cancelled-'
            : event.is_event_rescheduled?.toLowerCase() === 'yes'
            ? 'Rescheduled-'
            : ''}
        </Text>
        {event.name}
      </Text>
    </TouchableOpacity>
  );
});

const ModalInfoRow = ({ icon, label, value }) => (
  <View style={styles.modalInfoRow}>
    <VectorIcon
      icon="Ionicons"
      name={icon}
      size={20}
      color={colors.dark_grey}
      style={styles.modalInfoIcon}
    />
    <Text style={styles.modalInfoLabel}>{label}</Text>
    <Text style={styles.modalInfoValue}>{value}</Text>
  </View>
);

const EventDetailModal = ({ event, visible, onClose }) => {
  if (!event) return null;

  const eventStartDisplay = formatFullDateTime(event.event_start_date, true);
  const eventEndDisplay = formatFullDateTime(event.event_end_date, true);
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{event.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <VectorIcon
                icon="Ionicons"
                name="close"
                size={24}
                color={colors.dark_grey}
              />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <ModalInfoRow
                icon="time-outline"
                label="Start"
                value={eventStartDisplay}
              />
              <ModalInfoRow
                icon="time-outline"
                label="End"
                value={eventEndDisplay}
              />
              <ModalInfoRow
                icon="people-outline"
                label="Meeting With"
                value={event.meeting_with || 'N/A'}
              />
              <ModalInfoRow
                icon="person-outline"
                label="Attended By"
                value={event.meeting_attended_by || 'N/A'}
              />
              <ModalInfoRow
                icon="briefcase-outline"
                label="On Behalf of"
                value={event.meeting_attend_on_behalf_client || 'N/A'}
              />
              <ModalInfoRow
                icon="earth-outline"
                label="Time Zone"
                value={event.destination_timezone || 'N/A'}
              />
              <ModalInfoRow
                icon="document-text-outline"
                label="Notes"
                value={event.notes || 'N/A'}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const TimelineHour = memo(({ timeLabel, isLast }) => {
  return (
    <View style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
      <Text style={styles.timeLabel}>
        {timeLabel.replace(':00', '').toLowerCase()}
      </Text>
      <View style={styles.hourLine} />
      {!isLast && (
        <View style={[styles.halfHourLine, { top: HOUR_HEIGHT / 2 }]} />
      )}
    </View>
  );
});

const DayCell = memo(
  ({ date, isCurrentMonth, isSelected, isToday, hasEvents, onSelectDate }) => {
    const dateNum = date.getDate();

    return (
      <TouchableOpacity
        style={styles.dayCell}
        onPress={() => onSelectDate(date)}
      >
        <View
          style={[
            styles.dateCircle,
            isToday && styles.todayDateCircle,
            isSelected && styles.selectedDateCircle,
          ]}
        >
          <Text
            style={[
              styles.dateText,
              !isCurrentMonth && styles.otherMonthDateText,
              isSelected && styles.selectedDateText,
            ]}
          >
            {dateNum}
          </Text>
        </View>
        {hasEvents && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    isSameDay(prevProps.date, nextProps.date) &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasEvents === nextProps.hasEvents &&
    prevProps.isCurrentMonth === nextProps.isCurrentMonth,
);

const CurrentTimeIndicator = memo(() => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const totalMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const minutesFromStartHour =
    totalMinutesFromMidnight - TIMELINE_START_HOUR * 60;

  if (
    minutesFromStartHour < 0 ||
    totalMinutesFromMidnight >= TIMELINE_END_HOUR * 60
  ) {
    return null;
  }

  const top = (minutesFromStartHour / 60) * HOUR_HEIGHT;
  const formatTimeDisplay = timeString => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  const timeString = formatTimeDisplay(
    `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
  );

  return (
    <View style={[styles.currentTimeContainer, { top }]}>
      <Text style={styles.currentTimeText}>{timeString}</Text>
      <View style={styles.currentTimeDot} />
      <View style={styles.currentTimeLine} />
    </View>
  );
});

// --- Custom Line Loader Component ---
const LineLoader = () => {
  const BAR_WIDTH = width * 0.5; // The moving bar will be 40% of the screen width
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear, // A smooth, constant speed
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1], // Animate from start to end
    outputRange: [-BAR_WIDTH, width], // Move from off-screen left to off-screen right
  });

  return <Animated.View style={[styles.loaderBar, { width: BAR_WIDTH, transform: [{ translateX }] }]} />;
};

// --- Main Calendar Screen Component ---

const CalendarScreen = () => {
  const initialDate = new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonthDate, setCurrentMonthDate] = useState(initialDate);
  const [eventsData, setEventsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const agendaScrollViewRef = useRef(null);

  const loadEventsForMonth = useCallback(async () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const cacheKey = `${year}-${month}`;

    console.log(`Fetching events for ${cacheKey}`);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = toYYYYMMDD(firstDayOfMonth);
    const endDate = toYYYYMMDD(lastDayOfMonth);

    try {
      const response = await api.get(
        `/auth/calendar?event_start_date=${startDate}&event_end_date=${endDate}`,
        {},
        { passToken: true },
      );
      console.log(
        `Events between ${startDate}to${endDate}`,
        response.data.lst_events,
      );
      if (response && response.data && response.data.lst_events) {
        const mapped = {};
        response.data.lst_events.forEach((ev, index) => {
          const start = new Date(ev.event_start_date);
          const end = new Date(ev.event_end_date);
          const durationMinutes = (end - start) / (1000 * 60);

          if (durationMinutes < 0) return;

          const dateKey = toYYYYMMDD(start);
          if (!mapped[dateKey]) {
            mapped[dateKey] = [];
          }

          mapped[dateKey].push({
            id: `${dateKey}-${index}`,
            name: ev.title,
            startTime: start.toTimeString().slice(0, 5),
            event_start_date: ev.event_start_date,
            event_end_date: ev.event_end_date,
            durationMinutes,
            destination_timezone: ev.destination_timezone,
            meeting_attended_by: ev.metting_attended_by,
            meeting_with: ev.metting_with,
            meeting_attend_on_behalf_client: ev.meeting_attend_on_behalf_client,
            notes: ev.notes,
            is_event_cancelled: ev.is_event_cancelled,
            is_event_rescheduled: ev.is_event_rescheduled,
          });
        });
        setEventsData(prevData => ({ ...prevData, ...mapped }));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentMonthDate]);

  useEffect(() => {
    setIsLoading(true);
    loadEventsForMonth();
  }, [loadEventsForMonth]);

  const calendarGrid = useMemo(() => {
    const grid = [];
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - (startDayOfWeek - i));
      grid.push(date);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      grid.push(new Date(year, month, i));
    }

    while (grid.length < 42) {
      const date = new Date(grid[grid.length - 1]);
      date.setDate(date.getDate() + 1);
      grid.push(date);
    }
    return grid;
  }, [currentMonthDate]);

  const events = useMemo(() => {
    const dateString = toYYYYMMDD(selectedDate);
    const dayEvents = eventsData[dateString] || [];
    return dayEvents.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );
  }, [selectedDate, eventsData]);

  // Calculate event layout with overlap handling
  const positionedEvents = useMemo(() => {
    return calculateEventLayout(events);
  }, [events]);

  useEffect(() => {
    if (positionedEvents.length > 0 && agendaScrollViewRef.current) {
      const firstEvent = positionedEvents[0];
      const totalMinutesFromMidnight = timeToMinutes(firstEvent.startTime);
      const minutesFromStartHour =
        totalMinutesFromMidnight - TIMELINE_START_HOUR * 60;

      const scrollToY = (minutesFromStartHour / 60) * HOUR_HEIGHT - 30;
      agendaScrollViewRef.current.scrollTo({
        y: Math.max(0, scrollToY),
        animated: true,
      });
    }
  }, [positionedEvents]);

  const timelineHours = useMemo(() => {
    const hours = [];
    for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
      const date = new Date(2000, 0, 1, h, 0);
      const timeLabel = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
      });
      hours.push(timeLabel);
    }
    return hours;
  }, []);

  const handlePreviousMonth = () => {
    setCurrentMonthDate(
      prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  const handleSelectDate = useCallback(date => {
    setSelectedDate(date);
  }, []);

  const handleSelectEvent = useCallback(event => {
    setSelectedEvent(event);
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEventsForMonth();
  }, [loadEventsForMonth]);

  return (
    <>
      <EventDetailModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>
              {currentMonthDate.toLocaleDateString('en-US', {
                month: 'long',
              })}
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.navButton}>
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.PrimaryGreen} />
              ) : (
                <VectorIcon
                  icon="MaterialIcons"
                  name="refresh"
                  size={24}
                  color={colors.dark_grey}
                />
              )}
            </TouchableOpacity>
            <View style={styles.navContainer}>
              <TouchableOpacity
                onPress={handleGoToToday}
                style={styles.todayButton}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePreviousMonth}
                style={styles.navButton}
              >
                <VectorIcon
                  icon="MaterialIcons"
                  name="chevron-left"
                  size={24}
                  color={colors.dark_grey}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.navButton}
              >
                <VectorIcon
                  icon="MaterialIcons"
                  name="chevron-right"
                  size={24}
                  color={colors.dark_grey}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading && !isRefreshing && (
            <View style={styles.loaderContainer}>
              <LineLoader />
            </View>
          )}

          <View style={styles.gridContainer}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
            {calendarGrid.map((date, index) => {
              const dateNum = date.getDate();
              const isCurrentMonth =
                date.getMonth() === currentMonthDate.getMonth();
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, TODAY);
              const hasEvents = (eventsData[toYYYYMMDD(date)] || []).length > 0;

              return (
                <DayCell
                  key={index}
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={isSelected}
                  isToday={isToday}
                  hasEvents={hasEvents}
                  onSelectDate={handleSelectDate}
                />
              );
            })}
          </View>

          <View style={styles.dateInfoContainer}>
            <Text style={styles.dateInfoText}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}{' '}
              <Text style={styles.dateInfoSubText}>
                {selectedDate.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.agendaContainer}
          ref={agendaScrollViewRef}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.PrimaryGreen]}
            />
          }
        >
          <View style={styles.timelineWrapper}>
            {timelineHours.map((timeLabel, index) => {
              const isLast = index === timelineHours.length - 1;
              return (
                <TimelineHour
                  key={index}
                  timeLabel={timeLabel}
                  isLast={isLast}
                />
              );
            })}

            {isSameDay(selectedDate, TODAY) && <CurrentTimeIndicator />}

            <View style={styles.eventsOverlay}>
              {positionedEvents.map(event => {
                const totalMinutesFromMidnight = timeToMinutes(event.startTime);
                const minutesFromStartHour =
                  totalMinutesFromMidnight - TIMELINE_START_HOUR * 60;

                if (
                  minutesFromStartHour < 0 ||
                  totalMinutesFromMidnight >= TIMELINE_END_HOUR * 60
                ) {
                  return null;
                }

                const topOffset = (minutesFromStartHour / 60) * HOUR_HEIGHT;
                const height = (event.durationMinutes / 60) * HOUR_HEIGHT;

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    top={topOffset}
                    height={height}
                    width={event.width}
                    left={event.left}
                    onPress={handleSelectEvent}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// --- Styling ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base_color },
  header: {
    backgroundColor: colors.base_color,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: BorderWidth.thin,
    borderBottomColor: colors.border_light_color,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  monthTitle: {
    fontSize: FontSize.lg * 1.2,
    fontFamily: 'Montserrat-Bold',
    color: colors.black_color,
    flex: 1,
  },
  navContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  todayButton: {
    backgroundColor: colors.border_light_color,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  todayButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
    color: colors.dark_grey,
  },
  navButton: {
    padding: Spacing.xs,
    borderRadius: 50,
    marginLeft: Spacing.xs,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  loaderContainer: { // The track for the loader
    height: 2.5,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  loaderBar: { // The moving part of the loader
    height: '100%',
    backgroundColor: colors.PrimaryGreen,
  },
  dayHeaderCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dayHeaderText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
    color: colors.dark_grey,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: `${100 / 7}%`,
    height: 48,
    position: 'relative',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.PrimaryGreen,
    position: 'absolute',
    bottom: 6,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  todayDateCircle: { backgroundColor: colors.border_light_color },
  selectedDateCircle: {
    backgroundColor: colors.PrimaryGreen,
  },
  dateText: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-Medium',
    color: colors.text_dark,
  },
  otherMonthDateText: {
    color: colors.text_light_color,
    fontFamily: 'Montserrat-Regular',
  },
  selectedDateText: {
    color: colors.base_color,
    fontFamily: 'Montserrat-Bold',
  },
  dateInfoContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: colors.LightBG,
    borderTopWidth: BorderWidth.thin,
    borderTopColor: colors.light_gray,
  },
  dateInfoText: {
    fontSize: FontSize.md - 1,
    fontFamily: 'Montserrat-Bold',
    color: colors.text_dark,
  },
  dateInfoSubText: {
    fontFamily: 'Montserrat-Regular',
    color: colors.text_light_color,
  },
  agendaContainer: { flex: 1, paddingTop: Spacing.sm },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 60,
    paddingRight: Spacing.md,
    minHeight: (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  timeLabel: {
    position: 'absolute',
    left: -55,
    top: -Spacing.sm,
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.dark_grey,
    textAlign: 'right',
    width: 50,
  },
  hourLine: {
    flex: 1,
    height: BorderWidth.thin,
    backgroundColor: colors.light_gray,
  },
  halfHourLine: {
    position: 'absolute',
    right: 0,
    height: BorderWidth.thin,
    backgroundColor: colors.border_light_color,
    width: '100%',
    left: -60,
    paddingLeft: 60,
  },
  currentTimeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeText: {
    fontSize: FontSize.xs,
    fontFamily: 'Montserrat-Medium',
    color: colors.PrimaryGreen,
    width: 50,
    textAlign: 'right',
    marginRight: Spacing.xs,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.PrimaryGreen,
  },
  currentTimeLine: {
    flex: 1,
    height: BorderWidth.regular,
    backgroundColor: colors.PrimaryGreen,
  },
  eventsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  eventCard: {
    position: 'absolute',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    borderLeftWidth: 3,
  },
  eventCardTextName: {
    fontSize: FontSize.sm,
    fontFamily: 'AlanSans-Regular',
    color: colors.text_dark,
  },
  eventStatus: {
    fontSize: FontSize.xs,
    fontFamily: 'Montserrat-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.8,
    backgroundColor: colors.base_color,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light_color,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: 'Montserrat-Bold',
    color: colors.black_color,
    flex: 1,
    marginRight: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    // No specific styles needed yet
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalInfoIcon: {
    marginRight: Spacing.md,
  },
  modalInfoLabel: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    width: 120,
  },
  modalInfoValue: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-Regular',
    color: colors.text_dark,
    flex: 1,
    textAlign: 'left',
  },
  modalDescription: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.dark_grey,
    lineHeight: FontSize.sm * 1.5,
    marginTop: Spacing.sm,
  },
});

export default CalendarScreen;
