import { Controller, Get, Post, Body, Req, Param, Delete, Patch, UseGuards, Sse, MessageEvent, ParseUUIDPipe } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Observable } from 'rxjs';
import { SkipThrottle } from '@nestjs/throttler';

@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post()
    create(@Req() req: Request & { user: { id: string } }, @Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationsService.create(req.user.id, createNotificationDto);
    }

    // One long-lived connection, reopened by the browser when it drops.
    @SkipThrottle()
    @Sse('stream')
    stream(@Req() req: Request & { user: { id: string } }): Observable<MessageEvent> {
        return this.notificationsService.getStream(req.user.id);
    }

    @Get()
    findAll(@Req() req: Request & { user: { id: string } }) {
        return this.notificationsService.findAll(req.user.id);
    }

    @Patch(':id/read')
    markAsRead(@Req() req: Request & { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
        return this.notificationsService.markAsRead(req.user.id, id);
    }

    @Delete(':id')
    remove(@Req() req: Request & { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
        return this.notificationsService.remove(req.user.id, id);
    }
}
